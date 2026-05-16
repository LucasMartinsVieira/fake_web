export type TwitterTheme = "light" | "dim" | "dark";
export type TwitterView = "tweet" | "replyChain" | "block" | "suspension";

export interface TwitterPost {
  id: string;
  name: string;
  username: string;
  avatarAssetId: string | null;
  content: string;
  mediaAssetId: string | null;
  mediaAlt: string;
  timestamp: string;
  views: string;
  comments: string;
  retweets: string;
  likes: string;
  bookmarks: string;
  showTimestamp: boolean;
  showMetrics: boolean;
}

export interface TwitterModuleState {
  theme: TwitterTheme;
  view: TwitterView;
  primaryTweet: TwitterPost;
  replyChain: TwitterPost[];
}

export interface TwitterWorkspacePatch {
  theme?: TwitterTheme;
  view?: TwitterView;
}

export interface TwitterPostDraft {
  name?: string;
  username?: string;
  avatarAssetId?: string | null;
  content?: string;
  mediaAssetId?: string | null;
  mediaAlt?: string;
  timestamp?: string;
  views?: string;
  comments?: string;
  retweets?: string;
  likes?: string;
  bookmarks?: string;
  showTimestamp?: boolean;
  showMetrics?: boolean;
}
