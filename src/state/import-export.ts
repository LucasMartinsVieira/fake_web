import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import type {
  DiscordAccount,
  DiscordAttachment,
  DiscordMessage,
  DiscordModuleState,
  DiscordStoryPart,
} from "@/modules/discord/state/discord-types";
import { normalizeDiscordState } from "@/modules/discord/state/discord-state";
import { initialStateSnapshot, type AppState } from "@/state/app-types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
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
    isString(record.roleColor) &&
    (record.status === "online" ||
      record.status === "idle" ||
      record.status === "dnd" ||
      record.status === "invisible")
  );
}

function isAttachment(value: unknown): value is DiscordAttachment {
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

function isPart(value: unknown): value is DiscordStoryPart {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.id) &&
    isString(record.label) &&
    isString(record.serverName) &&
    isString(record.channelName) &&
    (record.theme === "ash" || record.theme === "dark") &&
    (record.inputTargetAccountId === undefined ||
      record.inputTargetAccountId === null ||
      isString(record.inputTargetAccountId)) &&
    (record.typingAccountId === undefined ||
      record.typingAccountId === null ||
      isString(record.typingAccountId)) &&
    Array.isArray(record.messages) &&
    record.messages.every(isMessage)
  );
}

function isDiscordModuleState(value: unknown): value is DiscordModuleState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.storyTitle) &&
    Array.isArray(record.accounts) &&
    record.accounts.every(isAccount) &&
    Array.isArray(record.parts) &&
    record.parts.every(isPart) &&
    (record.activeStoryPartId === undefined ||
      record.activeStoryPartId === null ||
      isString(record.activeStoryPartId))
  );
}

function isLegacyDiscordState(value: unknown): value is Partial<DiscordModuleState> & Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isString(record.serverName) &&
    isString(record.channelName) &&
    Array.isArray(record.accounts) &&
    record.accounts.every(isAccount) &&
    Array.isArray(record.messages) &&
    record.messages.every(isMessage)
  );
}

export function serializeAppState(state: AppState) {
  const exportableState: AppState = {
    ...state,
    discordState: {
      ...state.discordState,
      accounts: state.discordState.accounts.map((account) => ({
        avatarAssetId: null,
        id: account.id,
        username: account.username,
        roleColor: account.roleColor,
        status: account.status,
      })),
      parts: state.discordState.parts.map((part) => ({
        ...part,
        messages: part.messages.map((message) => ({
          ...message,
          attachments: message.attachments.map((attachment) => ({
            ...attachment,
            assetId: null,
          })),
        })),
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

  const discordState = parsed.discordState;

  if (!isDiscordModuleState(discordState) && !isLegacyDiscordState(discordState)) {
    throw new Error("The imported JSON has an invalid Discord state.");
  }

  const normalizedDiscordState = normalizeDiscordState(
    (discordState ?? initialDiscordState) as Partial<DiscordModuleState> & Record<string, unknown>,
  );

  return {
    ...initialStateSnapshot,
    ...parsed,
    discordState: normalizedDiscordState,
  };
}
