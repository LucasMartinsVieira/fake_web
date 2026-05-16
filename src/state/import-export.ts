import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import type {
  DiscordAccount,
  DiscordMessage,
  DiscordModuleState,
} from "@/modules/discord/state/discord-types";
import { initialTwitterState } from "@/modules/twitter/state/twitter-initial-state";
import type {
  TwitterModuleState,
  TwitterPost,
} from "@/modules/twitter/state/twitter-types";
import { initialStateSnapshot, type AppState } from "@/state/app-types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isAccount(value: unknown): value is DiscordAccount {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.id) &&
    isString(record.username) &&
    (record.avatarAssetId === undefined ||
      record.avatarAssetId === null ||
      isString(record.avatarAssetId) ||
      record.avatarBase64 === null ||
      isString(record.avatarBase64)) &&
    isString(record.roleColor)
  );
}

function isAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.id) &&
    (record.type === "image" || record.type === "gif") &&
    isString(record.name) &&
    (record.assetId === undefined ||
      record.assetId === null ||
      isString(record.assetId) ||
      record.base64 === undefined ||
      isString(record.base64))
  );
}

function isMessage(value: unknown): value is DiscordMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.id) &&
    (record.type === "user" || record.type === "system") &&
    (record.authorId === null || isString(record.authorId)) &&
    isString(record.authorName) &&
    isString(record.roleColor) &&
    isString(record.content) &&
    isString(record.timestamp) &&
    isBoolean(record.manualTimestamp) &&
    Array.isArray(record.attachments) &&
    record.attachments.every(isAttachment)
  );
}

function isDiscordModuleState(value: unknown): value is DiscordModuleState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.serverName) &&
    isString(record.channelName) &&
    (record.inputTargetAccountId === undefined ||
      record.inputTargetAccountId === null ||
      isString(record.inputTargetAccountId)) &&
    (record.typingAccountId === undefined ||
      record.typingAccountId === null ||
      isString(record.typingAccountId)) &&
    Array.isArray(record.accounts) &&
    record.accounts.every(isAccount) &&
    Array.isArray(record.messages) &&
    record.messages.every(isMessage)
  );
}

function isTwitterPost(value: unknown): value is TwitterPost {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.id) &&
    isString(record.name) &&
    isString(record.username) &&
    (record.avatarAssetId === undefined ||
      record.avatarAssetId === null ||
      isString(record.avatarAssetId)) &&
    isString(record.content) &&
    (record.mediaAssetId === undefined ||
      record.mediaAssetId === null ||
      isString(record.mediaAssetId)) &&
    isString(record.mediaAlt) &&
    isString(record.timestamp) &&
    isString(record.views) &&
    isString(record.comments) &&
    isString(record.retweets) &&
    isString(record.likes) &&
    isString(record.bookmarks) &&
    ((record.showTimestamp === undefined && record.showMetrics === undefined) ||
      (isBoolean(record.showTimestamp) && isBoolean(record.showMetrics)) ||
      record.displayMode === "timestamp" ||
      record.displayMode === "metrics")
  );
}

function isTwitterModuleState(value: unknown): value is TwitterModuleState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    (record.theme === "light" || record.theme === "dim" || record.theme === "dark") &&
    (record.view === "tweet" ||
      record.view === "replyChain" ||
      record.view === "block" ||
      record.view === "suspension") &&
    isTwitterPost(record.primaryTweet) &&
    Array.isArray(record.replyChain) &&
    record.replyChain.every(isTwitterPost)
  );
}

function getImportedModuleZooms(parsed: Partial<AppState>) {
  const rawModuleZooms = parsed.moduleZooms;
  const legacyCanvasScale = (parsed as Partial<AppState> & { canvasScale?: unknown })
    .canvasScale;
  const fallback = isNumber(legacyCanvasScale)
    ? legacyCanvasScale
    : initialStateSnapshot.moduleZooms.discord;

  if (!rawModuleZooms || typeof rawModuleZooms !== "object") {
    return {
      ...initialStateSnapshot.moduleZooms,
      discord: fallback,
      twitter: fallback,
      instagram: fallback,
    };
  }

  const record = rawModuleZooms as Record<string, unknown>;

  return {
    discord: isNumber(record.discord) ? record.discord : fallback,
    twitter: isNumber(record.twitter) ? record.twitter : fallback,
    instagram: isNumber(record.instagram) ? record.instagram : fallback,
  };
}

export function serializeAppState(state: AppState) {
  const exportableState: AppState = {
    ...state,
    discordState: {
      ...state.discordState,
      accounts: state.discordState.accounts.map((account) => ({
        ...account,
        avatarAssetId: null,
      })),
      messages: state.discordState.messages.map((message) => ({
        ...message,
        attachments: message.attachments.map((attachment) => ({
          ...attachment,
          assetId: null,
        })),
      })),
    },
    twitterState: {
      ...state.twitterState,
      primaryTweet: {
        ...state.twitterState.primaryTweet,
        avatarAssetId: null,
        mediaAssetId: null,
      },
      replyChain: state.twitterState.replyChain.map((tweet) => ({
        ...tweet,
        avatarAssetId: null,
        mediaAssetId: null,
      })),
    },
  };

  return JSON.stringify(exportableState, null, 2);
}

export function parseImportedAppState(raw: string): AppState {
  const parsed = JSON.parse(raw) as Partial<AppState>;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("The imported JSON is not a valid application state.");
  }

  const nextState: AppState = {
    ...initialStateSnapshot,
    ...parsed,
    moduleZooms: getImportedModuleZooms(parsed),
    discordState: isDiscordModuleState(parsed.discordState)
      ? parsed.discordState
      : initialDiscordState,
    twitterState: isTwitterModuleState(parsed.twitterState)
      ? parsed.twitterState
      : initialTwitterState,
  };

  if (!isDiscordModuleState(nextState.discordState)) {
    throw new Error("The imported JSON has an invalid Discord state.");
  }

  if (!isTwitterModuleState(nextState.twitterState)) {
    throw new Error("The imported JSON has an invalid X/Twitter state.");
  }

  return {
    ...nextState,
    discordState: {
      ...nextState.discordState,
      accounts: nextState.discordState.accounts.map((account) => ({
        ...account,
        avatarAssetId: null,
      })),
      messages: nextState.discordState.messages.map((message) => ({
        ...message,
        attachments: message.attachments.map((attachment) => ({
          ...attachment,
          assetId: null,
        })),
      })),
    },
    twitterState: {
      ...nextState.twitterState,
      primaryTweet: {
        ...nextState.twitterState.primaryTweet,
        avatarAssetId: null,
        mediaAssetId: null,
      },
      replyChain: nextState.twitterState.replyChain.map((tweet) => ({
        ...tweet,
        avatarAssetId: null,
        mediaAssetId: null,
      })),
    },
  };
}
