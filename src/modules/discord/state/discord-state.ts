import {
  DiscordAccount,
  DiscordAccountDraft,
  DiscordMessage,
  DiscordMessageDraft,
  DiscordMessagePatch,
  DiscordModuleState,
  DiscordStoryPart,
  DiscordStoryPartPatch,
} from "@/modules/discord/state/discord-types";
import { generateNextTimestamp } from "@/modules/discord/utils/generate-next-timestamp";

const DEFAULT_ROLE_COLOR = "#f2bd62";
const DEFAULT_START_TIMESTAMP = "2026-04-03T15:00:00.000Z";
const DEFAULT_STORY_TITLE = "Untitled Story";
const DEFAULT_PART_LABEL = "Part 1";
const DEFAULT_SERVER_NAME = "Fake Web Studio";
const DEFAULT_CHANNEL_NAME = "general";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function getAccountSnapshot(
  accounts: DiscordAccount[],
  authorId: string | null | undefined,
) {
  if (!authorId) {
    return {
      authorId: null,
      authorName: "System",
      roleColor: "#b5bac1",
    };
  }

  const account = accounts.find((entry) => entry.id === authorId);

  if (!account) {
    return {
      authorId: null,
      authorName: "Unknown User",
      roleColor: DEFAULT_ROLE_COLOR,
    };
  }

  return {
    authorId: account.id,
    authorName: account.username,
    roleColor: account.roleColor,
  };
}

function createDefaultStoryPart(): DiscordStoryPart {
  return {
    id: createId("part"),
    label: DEFAULT_PART_LABEL,
    serverName: DEFAULT_SERVER_NAME,
    channelName: DEFAULT_CHANNEL_NAME,
    theme: "ash",
    inputTargetAccountId: null,
    typingAccountId: null,
    messages: [],
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getAutoGapMinutes(
  previousMessage: DiscordMessage,
  message: DiscordMessage,
) {
  const maxGapMinutes =
    previousMessage.authorId !== message.authorId ||
    previousMessage.type === "system" ||
    message.type === "system"
      ? 3
      : 1;

  const seed = `${previousMessage.id}:${message.id}:${previousMessage.authorId ?? "system"}:${message.authorId ?? "system"}`;
  return hashString(seed) % (maxGapMinutes + 1);
}

function reflowMessageTimestamps(messages: DiscordMessage[]) {
  return messages.map((message, index, entries) => {
    if (index === 0) {
      if (message.manualTimestamp) {
        return message;
      }

      const nextTimestamp = message.timestamp || DEFAULT_START_TIMESTAMP;
      return message.timestamp === nextTimestamp
        ? message
        : {
            ...message,
            timestamp: nextTimestamp,
          };
    }

    if (message.manualTimestamp) {
      return message;
    }

    const previousMessage = entries[index - 1];
    const previousTimestamp =
      previousMessage?.timestamp || DEFAULT_START_TIMESTAMP;

    const nextTimestamp = generateNextTimestamp(
      previousTimestamp,
      getAutoGapMinutes(previousMessage, message),
    );

    return message.timestamp === nextTimestamp
      ? message
      : {
          ...message,
          timestamp: nextTimestamp,
        };
  });
}

function normalizeMessages(messages: DiscordMessage[]) {
  return reflowMessageTimestamps(
    messages.map((message) => ({
      id: message.id,
      type: message.type,
      authorId: message.authorId,
      authorName: message.authorName,
      roleColor: message.roleColor,
      content: message.content,
      timestamp: message.timestamp,
      manualTimestamp: message.manualTimestamp,
      attachments: (message.attachments ?? []).map((attachment) => {
        const legacyAttachment = attachment as typeof attachment & {
          base64?: string;
        };

        return {
          id: attachment.id,
          type: attachment.type,
          name: attachment.name,
          assetId: legacyAttachment.assetId ?? null,
          base64: legacyAttachment.base64 ?? undefined,
        };
      }),
    })),
  );
}

function normalizePart(
  part: Partial<DiscordStoryPart> & { messages?: DiscordMessage[] },
  accounts: DiscordAccount[],
): DiscordStoryPart {
  const hasInputTarget = accounts.some(
    (account) => account.id === part.inputTargetAccountId,
  );
  const hasTypingAccount = accounts.some(
    (account) => account.id === part.typingAccountId,
  );

  return {
    id: part.id ?? createId("part"),
    label: part.label?.trim() || DEFAULT_PART_LABEL,
    serverName: part.serverName?.trim() || DEFAULT_SERVER_NAME,
    channelName: part.channelName?.trim() || DEFAULT_CHANNEL_NAME,
    theme: part.theme ?? "ash",
    inputTargetAccountId:
      part.inputTargetAccountId && hasInputTarget
        ? part.inputTargetAccountId
        : (accounts[0]?.id ?? null),
    typingAccountId:
      part.typingAccountId && hasTypingAccount ? part.typingAccountId : null,
    messages: normalizeMessages(part.messages ?? []),
  };
}

function normalizeLegacyState(state: Partial<DiscordModuleState>) {
  const record = state as Record<string, unknown>;
  const legacyPart = normalizePart(
    {
      id: createId("part"),
      label: DEFAULT_PART_LABEL,
      serverName: (record.serverName as string | undefined) ?? DEFAULT_SERVER_NAME,
      channelName: (record.channelName as string | undefined) ?? DEFAULT_CHANNEL_NAME,
      theme: (record.theme as DiscordModuleState["parts"][number]["theme"] | undefined) ?? "ash",
      inputTargetAccountId: (record.inputTargetAccountId as string | null | undefined) ?? null,
      typingAccountId: (record.typingAccountId as string | null | undefined) ?? null,
      messages: (record.messages as DiscordMessage[] | undefined) ?? [],
    },
    (record.accounts as DiscordAccount[] | undefined) ?? [],
  );

  return {
    storyTitle: (record.storyTitle as string | undefined)?.trim() || DEFAULT_STORY_TITLE,
    accounts: ((record.accounts as DiscordAccount[] | undefined) ?? []).map((account) => ({
      id: account.id,
      username: account.username.trim() || "New User",
      avatarAssetId: account.avatarAssetId ?? null,
      roleColor: account.roleColor || DEFAULT_ROLE_COLOR,
      status: account.status || "online",
    })),
    parts: [legacyPart],
    activeStoryPartId: legacyPart.id,
  } satisfies DiscordModuleState;
}

function normalizeStoryState(state: Partial<DiscordModuleState>) {
  const record = state as Record<string, unknown>;
  const normalizedAccounts = ((record.accounts as DiscordAccount[] | undefined) ?? []).map((account) => {
    const legacyAccount = account as DiscordAccount & {
      avatarBase64?: string | null;
    };

    return {
      id: account.id,
      username: account.username.trim() || "New User",
      avatarAssetId: legacyAccount.avatarAssetId ?? null,
      avatarBase64: legacyAccount.avatarBase64 ?? undefined,
      roleColor: account.roleColor || DEFAULT_ROLE_COLOR,
      status: account.status || "online",
    };
  });

  const normalizedParts = Array.isArray(record.parts) && record.parts.length
    ? (record.parts as Array<Partial<DiscordStoryPart> & { messages?: DiscordMessage[] }>).map((part) =>
        normalizePart(part as Partial<DiscordStoryPart> & { messages?: DiscordMessage[] }, normalizedAccounts),
      )
    : [normalizePart(createDefaultStoryPart(), normalizedAccounts)];

  const activePartExists = normalizedParts.some(
    (part) => part.id === record.activeStoryPartId,
  );

  return {
    storyTitle: (record.storyTitle as string | undefined)?.trim() || DEFAULT_STORY_TITLE,
    accounts: normalizedAccounts,
    parts: normalizedParts,
    activeStoryPartId: activePartExists ? ((record.activeStoryPartId as string | null | undefined) ?? null) : normalizedParts[0]?.id ?? null,
  } satisfies DiscordModuleState;
}

export function normalizeDiscordState(state: Partial<DiscordModuleState>) {
  if (Array.isArray(state.parts)) {
    return normalizeStoryState(state);
  }

  return normalizeLegacyState(state);
}

export function getActiveStoryPart(state: DiscordModuleState) {
  return (
    state.parts.find((part) => part.id === state.activeStoryPartId) ??
    state.parts[0] ??
    createDefaultStoryPart()
  );
}

export function patchDiscordWorkspace(state: DiscordModuleState, patch: DiscordStoryPartPatch, partId = state.activeStoryPartId) {
  return {
    ...state,
    parts: state.parts.map((part) =>
      part.id === partId
        ? {
            ...part,
            ...patch,
            label: patch.label?.trim() || part.label,
            serverName: patch.serverName?.trim() || part.serverName,
            channelName: patch.channelName?.trim() || part.channelName,
            theme: patch.theme ?? part.theme,
            inputTargetAccountId:
              patch.inputTargetAccountId === undefined
                ? part.inputTargetAccountId
                : patch.inputTargetAccountId,
            typingAccountId:
              patch.typingAccountId === undefined
                ? part.typingAccountId
                : patch.typingAccountId,
          }
        : part,
    ),
  };
}

export function createDiscordAccount(
  state: DiscordModuleState,
  draft: DiscordAccountDraft,
) {
  const account: DiscordAccount = {
    id: createId("account"),
    username: draft.username.trim() || "New User",
    avatarAssetId: draft.avatarAssetId ?? null,
    roleColor: draft.roleColor ?? DEFAULT_ROLE_COLOR,
    status: draft.status ?? "online",
  };

  return {
    ...state,
    accounts: [...state.accounts, account],
  };
}

export function updateDiscordAccount(
  state: DiscordModuleState,
  accountId: string,
  patch: Partial<DiscordAccountDraft>,
) {
  const accounts = state.accounts.map((account) =>
    account.id === accountId
      ? {
          ...account,
          ...patch,
          username: patch.username?.trim() || account.username,
          avatarAssetId:
            patch.avatarAssetId === undefined
              ? account.avatarAssetId
              : patch.avatarAssetId,
          roleColor: patch.roleColor ?? account.roleColor,
          status: patch.status ?? account.status,
        }
      : account,
  );

  const updatedAccount = accounts.find((account) => account.id === accountId);

  if (!updatedAccount) {
    return state;
  }

  return {
    ...state,
    accounts,
    parts: state.parts.map((part) => ({
      ...part,
      messages: part.messages.map((message) =>
        message.authorId === accountId
          ? {
              ...message,
              authorName: updatedAccount.username,
              roleColor: updatedAccount.roleColor,
            }
          : message,
      ),
    })),
  };
}

export function removeDiscordAccount(
  state: DiscordModuleState,
  accountId: string,
) {
  const accounts = state.accounts.filter((account) => account.id !== accountId);

  return {
    ...state,
    accounts,
    parts: state.parts.map((part) => {
      const messages = reflowMessageTimestamps(
        part.messages.filter((message) => message.authorId !== accountId),
      );

      return {
        ...part,
        inputTargetAccountId:
          part.inputTargetAccountId === accountId
            ? (accounts[0]?.id ?? null)
            : part.inputTargetAccountId,
        typingAccountId:
          part.typingAccountId === accountId ? null : part.typingAccountId,
        messages,
      };
    }),
  };
}

export function createDiscordMessage(
  state: DiscordModuleState,
  draft: DiscordMessageDraft,
  partId = state.activeStoryPartId,
) {
  const author = getAccountSnapshot(state.accounts, draft.authorId);
  const manualTimestamp = draft.manualTimestamp ?? false;
  const targetPart =
    state.parts.find((part) => part.id === partId) ?? state.parts[0] ?? createDefaultStoryPart();
  const previousTimestamp =
    targetPart.messages[targetPart.messages.length - 1]?.timestamp ??
    DEFAULT_START_TIMESTAMP;

  const message: DiscordMessage = {
    id: createId("message"),
    type: draft.type ?? "user",
    authorId: draft.type === "system" ? null : author.authorId,
    authorName: draft.type === "system" ? "System" : author.authorName,
    roleColor: draft.type === "system" ? "#b5bac1" : author.roleColor,
    content: draft.content,
    timestamp: draft.timestamp ?? previousTimestamp,
    manualTimestamp,
    attachments: draft.attachments ?? [],
  };

  return {
    ...state,
    parts: state.parts.map((part) =>
      part.id === targetPart.id
        ? {
            ...part,
            messages: reflowMessageTimestamps([...part.messages, message]),
          }
        : part,
    ),
  };
}

export function updateDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
  patch: DiscordMessagePatch,
  partId = state.activeStoryPartId,
) {
  const parts = state.parts.map((part) => {
    if (partId && part.id !== partId) {
      return part;
    }

    const messages = part.messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      const nextType = patch.type ?? message.type;
      const nextAuthorId =
        nextType === "system" ? null : (patch.authorId ?? message.authorId);
      const author = getAccountSnapshot(state.accounts, nextAuthorId);

      return {
        ...message,
        ...patch,
        type: nextType,
        authorId: nextType === "system" ? null : author.authorId,
        authorName: nextType === "system" ? "System" : author.authorName,
        roleColor: nextType === "system" ? "#b5bac1" : author.roleColor,
        content: patch.content ?? message.content,
        timestamp: patch.timestamp ?? message.timestamp,
        manualTimestamp: patch.manualTimestamp ?? message.manualTimestamp,
        attachments: patch.attachments ?? message.attachments,
      };
    });

    return {
      ...part,
      messages: reflowMessageTimestamps(messages),
    };
  });

  return {
    ...state,
    parts,
  };
}

export function removeDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
  partId = state.activeStoryPartId,
) {
  return {
    ...state,
    parts: state.parts.map((part) =>
      partId && part.id !== partId
        ? part
        : {
            ...part,
            messages: reflowMessageTimestamps(
              part.messages.filter((message) => message.id !== messageId),
            ),
          },
    ),
  };
}

export function moveDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
  direction: "up" | "down",
  partId = state.activeStoryPartId,
) {
  return {
    ...state,
    parts: state.parts.map((part) => {
      if (partId && part.id !== partId) {
        return part;
      }

      const currentIndex = part.messages.findIndex(
        (message) => message.id === messageId,
      );

      if (currentIndex === -1) {
        return part;
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= part.messages.length) {
        return part;
      }

      const messages = [...part.messages];
      const [message] = messages.splice(currentIndex, 1);
      messages.splice(targetIndex, 0, message);

      return {
        ...part,
        messages: reflowMessageTimestamps(messages),
      };
    }),
  };
}
