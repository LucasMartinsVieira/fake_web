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
const DEFAULT_MESSAGE_GAP_MINUTES = 3;
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

    const previousTimestamp = entries[index - 1]?.timestamp || DEFAULT_START_TIMESTAMP;

    return {
      ...message,
      timestamp: generateNextTimestamp(
        previousTimestamp,
        DEFAULT_MESSAGE_GAP_MINUTES,
      ),
    };
  });
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
    avatarBase64: draft.avatarBase64 ?? null,
    roleColor: draft.roleColor ?? DEFAULT_ROLE_COLOR,
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
          avatarBase64:
            patch.avatarBase64 === undefined
              ? account.avatarBase64
              : patch.avatarBase64,
          roleColor: patch.roleColor ?? account.roleColor,
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
  return {
    ...state,
    accounts: state.accounts.filter((account) => account.id !== accountId),
    messages: state.messages.map((message) =>
      message.authorId === accountId
        ? {
            ...message,
            authorId: null,
          }
        : message,
    ),
  };
}

export function createDiscordMessage(
  state: DiscordModuleState,
  draft: DiscordMessageDraft,
) {
  const author = getAccountSnapshot(state.accounts, draft.authorId);
  const previousTimestamp =
    state.messages[state.messages.length - 1]?.timestamp || DEFAULT_START_TIMESTAMP;
  const manualTimestamp = draft.manualTimestamp ?? false;

  const message: DiscordMessage = {
    id: createId("message"),
    type: draft.type ?? "user",
    authorId: draft.type === "system" ? null : author.authorId,
    authorName: draft.type === "system" ? "System" : author.authorName,
    roleColor: draft.type === "system" ? "#b5bac1" : author.roleColor,
    content: draft.content,
    timestamp:
      draft.timestamp ??
      generateNextTimestamp(previousTimestamp, DEFAULT_MESSAGE_GAP_MINUTES),
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
      nextType === "system" ? null : patch.authorId ?? message.authorId;
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

  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

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
