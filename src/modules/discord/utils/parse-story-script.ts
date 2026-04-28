import type {
  DiscordAccount,
  DiscordMessage,
  DiscordModuleState,
  DiscordStoryPart,
} from "@/modules/discord/state/discord-types";
import { generateNextTimestamp } from "@/modules/discord/utils/generate-next-timestamp";

const DEFAULT_SERVER_NAME = "Fake Web Studio";
const DEFAULT_CHANNEL_NAME = "general";
const DEFAULT_ROLE_COLORS = [
  "#f2bd62",
  "#57f287",
  "#5dade2",
  "#eb459e",
  "#c27c0e",
  "#ed4245",
];
const DEFAULT_START_TIMESTAMP = "2026-04-04T12:00:00.000Z";
const DEFAULT_STORY_TITLE = "Untitled Story";

type LegacySection = "workspace" | "accounts" | "messages";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function parseAbsoluteTimestamp(value: string) {
  const trimmed = value.trim();
  const naturalDateMatch = trimmed.match(
    /^(Today|Yesterday)\s+(\d{1,2}:\d{2})$/i,
  );

  if (naturalDateMatch) {
    const [, dayKeyword, timePart] = naturalDateMatch;
    const baseDate = new Date();
    baseDate.setSeconds(0, 0);

    if (dayKeyword.toLowerCase() === "yesterday") {
      baseDate.setDate(baseDate.getDate() - 1);
    }

    const [hours, minutes] = timePart.split(":").map(Number);
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate.toISOString();
  }

  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: "${value}"`);
  }

  return date.toISOString();
}

function parseGapMinutes(token: string) {
  const match = token.match(/^\+(\d+)m$/i);

  if (!match) {
    throw new Error(`Invalid relative gap token: "${token}"`);
  }

  return Number(match[1]);
}

function getRoleColor(index: number) {
  return DEFAULT_ROLE_COLORS[index % DEFAULT_ROLE_COLORS.length];
}

function ensureAccount(
  accounts: DiscordAccount[],
  accountMap: Map<string, DiscordAccount>,
  username: string,
) {
  const existing = accountMap.get(username);

  if (existing) {
    return existing;
  }

  const account: DiscordAccount = {
    id: createId("account"),
    username,
    avatarAssetId: null,
    roleColor: getRoleColor(accounts.length),
    status: "online",
  };

  accounts.push(account);
  accountMap.set(username, account);
  return account;
}

function normalizeAccountLine(line: string) {
  const separatorIndex = line.indexOf("|");
  const username =
    separatorIndex === -1 ? line.trim() : line.slice(0, separatorIndex).trim();
  const color =
    separatorIndex === -1 ? undefined : line.slice(separatorIndex + 1).trim();

  if (!username) {
    throw new Error(`Invalid account line: "${line}"`);
  }

  return { username, color };
}

function parseMessageLine(
  line: string,
  messages: DiscordMessage[],
  accounts: DiscordAccount[],
  accountMap: Map<string, DiscordAccount>,
) {
  let workingLine = line;
  let manualTimestamp = false;
  let timestamp: string | undefined;

  const pipeIndex = workingLine.indexOf("|");

  if (pipeIndex !== -1) {
    const left = workingLine.slice(0, pipeIndex).trim();
    const right = workingLine.slice(pipeIndex + 1).trim();

    if (left.startsWith("+")) {
      const previousTimestamp =
        messages[messages.length - 1]?.timestamp ?? DEFAULT_START_TIMESTAMP;
      timestamp = generateNextTimestamp(previousTimestamp, parseGapMinutes(left));
      manualTimestamp = true;
    } else {
      timestamp = parseAbsoluteTimestamp(left);
      manualTimestamp = true;
    }

    workingLine = right;
  }

  const separatorIndex = workingLine.indexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`Invalid message line: "${line}"`);
  }

  const actor = workingLine.slice(0, separatorIndex).trim();
  const content = workingLine.slice(separatorIndex + 1).trim();

  if (!content) {
    throw new Error(`Message content cannot be empty: "${line}"`);
  }

  if (actor.toUpperCase() === "SYSTEM") {
    messages.push({
      id: createId("message"),
      type: "system",
      authorId: null,
      authorName: "System",
      roleColor: "#b5bac1",
      content,
      timestamp:
        timestamp ??
        generateNextTimestamp(
          messages[messages.length - 1]?.timestamp ?? DEFAULT_START_TIMESTAMP,
          1,
        ),
      manualTimestamp,
      attachments: [],
    });
    return;
  }

  const account = ensureAccount(accounts, accountMap, actor);

  messages.push({
    id: createId("message"),
    type: "user",
    authorId: account.id,
    authorName: account.username,
    roleColor: account.roleColor,
    content,
    timestamp:
      timestamp ??
      generateNextTimestamp(
        messages[messages.length - 1]?.timestamp ?? DEFAULT_START_TIMESTAMP,
        1,
      ),
    manualTimestamp,
    attachments: [],
  });
}

function finalizePart(
  part: Partial<DiscordStoryPart> | null,
  accounts: DiscordAccount[],
  parts: DiscordStoryPart[],
) {
  if (!part) {
    return;
  }

  if (!part.messages?.length) {
    throw new Error(`Part "${part.label ?? parts.length + 1}" has no messages.`);
  }

  parts.push({
    id: part.id ?? createId("part"),
    label: part.label?.trim() || `Part ${parts.length + 1}`,
    serverName: part.serverName?.trim() || DEFAULT_SERVER_NAME,
    channelName: part.channelName?.trim() || DEFAULT_CHANNEL_NAME,
    theme: part.theme ?? "ash",
    inputTargetAccountId:
      part.inputTargetAccountId && accounts.some((account) => account.id === part.inputTargetAccountId)
        ? part.inputTargetAccountId
        : (accounts[0]?.id ?? null),
    typingAccountId:
      part.typingAccountId && accounts.some((account) => account.id === part.typingAccountId)
        ? part.typingAccountId
        : null,
    messages: part.messages,
  });
}

function parseStrictStoryScript(raw: string): DiscordModuleState {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    throw new Error("The story script is empty.");
  }

  const accounts: DiscordAccount[] = [];
  const accountMap = new Map<string, DiscordAccount>();
  const parts: DiscordStoryPart[] = [];

  let storyTitle = DEFAULT_STORY_TITLE;
  let topSection: "story" | "accounts" | null = null;
  let currentPart: Partial<DiscordStoryPart> | null = null;
  let currentPartSection: "meta" | "messages" | null = null;

  for (const line of lines) {
    if (line === "@story") {
      if (currentPart) {
        throw new Error("@story must appear before @part sections.");
      }

      topSection = "story";
      continue;
    }

    if (line === "@accounts") {
      if (currentPart) {
        throw new Error("@accounts must appear before @part sections.");
      }

      topSection = "accounts";
      continue;
    }

    if (line === "@part") {
      finalizePart(currentPart, accounts, parts);
      currentPart = {
        id: createId("part"),
        label: `Part ${parts.length + 1}`,
        serverName: DEFAULT_SERVER_NAME,
        channelName: DEFAULT_CHANNEL_NAME,
        theme: "ash",
        inputTargetAccountId: null,
        typingAccountId: null,
        messages: [],
      };
      currentPartSection = "meta";
      topSection = null;
      continue;
    }

    if (line === "@messages") {
      if (!currentPart) {
        throw new Error("@messages must appear inside a @part section.");
      }

      currentPartSection = "messages";
      continue;
    }

    if (currentPart) {
      if (currentPartSection === "meta") {
        const separatorIndex = line.indexOf(":");

        if (separatorIndex === -1) {
          throw new Error(`Invalid part line: "${line}"`);
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (!value) {
          throw new Error(`Invalid part line: "${line}"`);
        }

        if (key === "label") {
          currentPart.label = value;
          continue;
        }

        if (key === "server") {
          currentPart.serverName = value;
          continue;
        }

        if (key === "channel") {
          currentPart.channelName = value;
          continue;
        }

        if (key === "theme") {
          if (value === "ash" || value === "dark") {
            currentPart.theme = value;
            continue;
          }

          throw new Error(`Invalid theme: "${value}"`);
        }

        throw new Error(`Unknown part key: "${key}"`);
      }

      if (currentPartSection === "messages") {
        parseMessageLine(line, currentPart.messages ?? [], accounts, accountMap);
        currentPart.messages = currentPart.messages ?? [];
        continue;
      }

      throw new Error("@part must include @messages.");
    }

    if (topSection === "story") {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        throw new Error(`Invalid story line: "${line}"`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key !== "title") {
        throw new Error(`Unknown story key: "${key}"`);
      }

      storyTitle = value || DEFAULT_STORY_TITLE;
      continue;
    }

    if (topSection === "accounts") {
      const { username, color } = normalizeAccountLine(line);
      const account = ensureAccount(accounts, accountMap, username);

      if (color) {
        account.roleColor = color;
      }

      continue;
    }

    throw new Error("Story script must begin with @story, @accounts, or @part.");
  }

  finalizePart(currentPart, accounts, parts);

  if (!parts.length) {
    throw new Error("The story script must include at least one @part section.");
  }

  return {
    storyTitle,
    accounts,
    parts,
    activeStoryPartId: parts[0]?.id ?? null,
  };
}

function parseLegacyStoryScript(raw: string): DiscordModuleState {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (!lines.length) {
    throw new Error("The story script is empty.");
  }

  let section: LegacySection | null = null;
  let storyTitle = DEFAULT_STORY_TITLE;
  let serverName = DEFAULT_SERVER_NAME;
  let channelName = DEFAULT_CHANNEL_NAME;
  let theme: DiscordModuleState["parts"][number]["theme"] = "ash";
  const accounts: DiscordAccount[] = [];
  const accountMap = new Map<string, DiscordAccount>();
  const messages: DiscordMessage[] = [];

  for (const line of lines) {
    if (line === "@workspace" || line === "@accounts" || line === "@messages") {
      section = line.slice(1) as LegacySection;
      continue;
    }

    if (!section) {
      throw new Error(
        "Story script must begin with a section like @workspace.",
      );
    }

    if (section === "workspace") {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        throw new Error(`Invalid workspace line: "${line}"`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!value) {
        throw new Error(`Invalid workspace line: "${line}"`);
      }

      if (key === "server") {
        serverName = value;
        continue;
      }

      if (key === "channel") {
        channelName = value;
        continue;
      }

      if (key === "theme") {
        if (value === "ash" || value === "dark") {
          theme = value;
          continue;
        }

        throw new Error(`Invalid theme: "${value}"`);
      }

      if (key === "title") {
        storyTitle = value;
        continue;
      }

      throw new Error(`Unknown workspace key: "${key}"`);
    }

    if (section === "accounts") {
      const { username, color } = normalizeAccountLine(line);
      const account = ensureAccount(accounts, accountMap, username);

      if (color) {
        account.roleColor = color;
      }

      continue;
    }

    if (section === "messages") {
      parseMessageLine(line, messages, accounts, accountMap);
    }
  }

  return {
    storyTitle,
    accounts,
    activeStoryPartId: "part-1",
    parts: [
      {
        id: "part-1",
        label: "Part 1",
        serverName,
        channelName,
        theme,
        inputTargetAccountId: accounts[0]?.id ?? null,
        typingAccountId: null,
        messages,
      },
    ],
  };
}

export function parseStoryScript(raw: string): DiscordModuleState {
  if (raw.includes("@part") || raw.includes("@story")) {
    return parseStrictStoryScript(raw);
  }

  return parseLegacyStoryScript(raw);
}
