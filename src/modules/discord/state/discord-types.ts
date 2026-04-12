export type DiscordMessageType = "user" | "system";
export type DiscordTheme = "ash" | "dark";
export type DiscordUserStatus = "online" | "idle" | "dnd" | "invisible";

export interface DiscordAccount {
  id: string;
  username: string;
  avatarAssetId: string | null;
  roleColor: string;
  status: DiscordUserStatus;
}

export interface DiscordAttachment {
  id: string;
  type: "image" | "gif";
  name: string;
  assetId: string | null;
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

export interface DiscordModuleState {
  serverName: string;
  channelName: string;
  theme: DiscordTheme;
  accounts: DiscordAccount[];
  messages: DiscordMessage[];
}

export interface DiscordWorkspacePatch {
  serverName?: string;
  channelName?: string;
  theme?: DiscordTheme;
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
