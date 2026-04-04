import type {
  DiscordAccount,
  DiscordMessage,
  DiscordModuleState,
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

type StorySection = "workspace" | "accounts" | "messages";

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
    avatarBase64: null,
    roleColor: getRoleColor(accounts.length),
  };

  accounts.push(account);
  accountMap.set(username, account);
  return account;
}

export function parseStoryScript(raw: string): DiscordModuleState {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (!lines.length) {
    throw new Error("The story script is empty.");
  }

  let section: StorySection | null = null;
  let serverName = DEFAULT_SERVER_NAME;
  let channelName = DEFAULT_CHANNEL_NAME;
  const accounts: DiscordAccount[] = [];
  const accountMap = new Map<string, DiscordAccount>();
  const messages: DiscordMessage[] = [];

  for (const line of lines) {
    if (line.startsWith("@")) {
      const nextSection = line.slice(1).toLowerCase();

      if (
        nextSection === "workspace" ||
        nextSection === "accounts" ||
        nextSection === "messages"
      ) {
        section = nextSection;
        continue;
      }

      throw new Error(`Unknown story section: "${line}"`);
    }

    if (!section) {
      throw new Error("Story script must begin with a section like @workspace.");
    }

    if (section === "workspace") {
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();

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

      throw new Error(`Unknown workspace key: "${key}"`);
    }

    if (section === "accounts") {
      const [usernamePart, colorPart] = line.split("|").map((part) => part.trim());
      const username = usernamePart;

      if (!username) {
        throw new Error(`Invalid account line: "${line}"`);
      }

      const account = ensureAccount(accounts, accountMap, username);

      if (colorPart) {
        account.roleColor = colorPart;
      }

      continue;
    }

    if (section === "messages") {
      let workingLine = line;
      let manualTimestamp = false;
      let timestamp: string | undefined;

      if (workingLine.includes("|")) {
        const [left, right] = workingLine.split("|").map((part) => part.trim());

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
        continue;
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
  }

  return {
    serverName,
    channelName,
    accounts,
    messages,
  };
}
