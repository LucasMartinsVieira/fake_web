export type DiscordMessageType = "user" | "system";
export type DiscordTheme = "ash" | "dark";

export interface DiscordAccount {
  id: string;
  username: string;
  avatarBase64: string | null;
  roleColor: string;
}

export interface DiscordAttachment {
  id: string;
  type: "image" | "gif";
  name: string;
  base64: string;
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
  avatarBase64?: string | null;
  roleColor?: string;
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
