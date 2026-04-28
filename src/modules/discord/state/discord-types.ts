export type DiscordMessageType = "user" | "system";
export type DiscordTheme = "ash" | "dark";
export type DiscordUserStatus = "online" | "idle" | "dnd" | "invisible";

export interface DiscordAccount {
  id: string;
  username: string;
  avatarAssetId: string | null;
  avatarBase64?: string;
  roleColor: string;
  status: DiscordUserStatus;
}

export interface DiscordAttachment {
  id: string;
  type: "image" | "gif";
  name: string;
  assetId: string | null;
  base64?: string;
}

export interface DiscordMessage {
  id: string;
  type: DiscordMessageType;
  authorId: string | null;
  authorName: string;
  roleColor: string;
  content: string;
  timestamp: string;
  manualTimestamp: boolean;
  attachments: DiscordAttachment[];
}

export interface DiscordStoryPart {
  id: string;
  label: string;
  serverName: string;
  channelName: string;
  theme: DiscordTheme;
  inputTargetAccountId: string | null;
  typingAccountId: string | null;
  messages: DiscordMessage[];
}

export interface DiscordModuleState {
  storyTitle: string;
  accounts: DiscordAccount[];
  parts: DiscordStoryPart[];
  activeStoryPartId: string | null;
}

export interface DiscordStoryPartPatch {
  label?: string;
  serverName?: string;
  channelName?: string;
  theme?: DiscordTheme;
  inputTargetAccountId?: string | null;
  typingAccountId?: string | null;
}

export interface DiscordAccountDraft {
  username: string;
  avatarAssetId?: string | null;
  roleColor?: string;
  status?: DiscordUserStatus;
}

export interface DiscordMessageDraft {
  type?: DiscordMessageType;
  authorId?: string | null;
  content: string;
  timestamp?: string;
  manualTimestamp?: boolean;
  attachments?: DiscordAttachment[];
}

export interface DiscordMessagePatch {
  type?: DiscordMessageType;
  authorId?: string | null;
  content?: string;
  timestamp?: string;
  manualTimestamp?: boolean;
  attachments?: DiscordAttachment[];
}
