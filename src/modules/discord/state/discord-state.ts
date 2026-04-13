import {
  DiscordAccount,
  DiscordAccountDraft,
  DiscordMessage,
  DiscordMessageDraft,
  DiscordMessagePatch,
  DiscordModuleState,
  DiscordWorkspacePatch,
} from "@/modules/discord/state/discord-types";
import { generateNextTimestamp } from "@/modules/discord/utils/generate-next-timestamp";

const DEFAULT_ROLE_COLOR = "#f2bd62";
const DEFAULT_START_TIMESTAMP = "2026-04-03T15:00:00.000Z";

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

      return {
        ...message,
        timestamp: message.timestamp || DEFAULT_START_TIMESTAMP,
      };
    }

    if (message.manualTimestamp) {
      return message;
    }

    const previousMessage = entries[index - 1];
    const previousTimestamp =
      previousMessage?.timestamp || DEFAULT_START_TIMESTAMP;

    return {
      ...message,
      timestamp: generateNextTimestamp(
        previousTimestamp,
        getAutoGapMinutes(previousMessage, message),
      ),
    };
  });
}

export function normalizeDiscordState(state: DiscordModuleState) {
  const normalizedAccounts = state.accounts.map((account) => {
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
  const hasInputTarget = normalizedAccounts.some(
    (account) => account.id === state.inputTargetAccountId,
  );
  const hasTypingAccount = normalizedAccounts.some(
    (account) => account.id === state.typingAccountId,
  );

  return {
    ...state,
    theme: state.theme ?? "ash",
    inputTargetAccountId:
      state.inputTargetAccountId && hasInputTarget
        ? state.inputTargetAccountId
        : (normalizedAccounts[0]?.id ?? null),
    typingAccountId:
      state.typingAccountId && hasTypingAccount ? state.typingAccountId : null,
    accounts: normalizedAccounts,
    messages: reflowMessageTimestamps(
      state.messages.map((message) => ({
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
    ),
  };
}

export function patchDiscordWorkspace(
  state: DiscordModuleState,
  patch: DiscordWorkspacePatch,
) {
  return {
    ...state,
    ...patch,
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
    messages: state.messages.map((message) =>
      message.authorId === accountId
        ? {
            ...message,
            authorName: updatedAccount.username,
            roleColor: updatedAccount.roleColor,
          }
        : message,
    ),
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
    inputTargetAccountId:
      state.inputTargetAccountId === accountId
        ? (accounts[0]?.id ?? null)
        : state.inputTargetAccountId,
    typingAccountId:
      state.typingAccountId === accountId ? null : state.typingAccountId,
    messages: reflowMessageTimestamps(
      state.messages.filter((message) => message.authorId !== accountId),
    ),
  };
}

export function createDiscordMessage(
  state: DiscordModuleState,
  draft: DiscordMessageDraft,
) {
  const author = getAccountSnapshot(state.accounts, draft.authorId);
  const manualTimestamp = draft.manualTimestamp ?? false;

  const message: DiscordMessage = {
    id: createId("message"),
    type: draft.type ?? "user",
    authorId: draft.type === "system" ? null : author.authorId,
    authorName: draft.type === "system" ? "System" : author.authorName,
    roleColor: draft.type === "system" ? "#b5bac1" : author.roleColor,
    content: draft.content,
    timestamp: draft.timestamp ?? DEFAULT_START_TIMESTAMP,
    manualTimestamp,
    attachments: draft.attachments ?? [],
  };

  return {
    ...state,
    messages: reflowMessageTimestamps([...state.messages, message]),
  };
}

export function updateDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
  patch: DiscordMessagePatch,
) {
  const messages = state.messages.map((message) => {
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
    ...state,
    messages: reflowMessageTimestamps(messages),
  };
}

export function removeDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
) {
  return {
    ...state,
    messages: reflowMessageTimestamps(
      state.messages.filter((message) => message.id !== messageId),
    ),
  };
}

export function moveDiscordMessage(
  state: DiscordModuleState,
  messageId: string,
  direction: "up" | "down",
) {
  const currentIndex = state.messages.findIndex(
    (message) => message.id === messageId,
  );

  if (currentIndex === -1) {
    return state;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= state.messages.length) {
    return state;
  }

  const messages = [...state.messages];
  const [message] = messages.splice(currentIndex, 1);
  messages.splice(targetIndex, 0, message);

  return {
    ...state,
    messages: reflowMessageTimestamps(messages),
  };
}
