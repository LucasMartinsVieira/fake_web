import type {
  TwitterModuleState,
  TwitterPost,
  TwitterPostDraft,
  TwitterWorkspacePatch,
} from "@/modules/twitter/state/twitter-types";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizePost(post: TwitterPost): TwitterPost {
  const legacyPost = post as TwitterPost & {
    displayMode?: "timestamp" | "metrics";
  };
  const showTimestamp =
    post.showTimestamp ??
    (legacyPost.displayMode === "timestamp"
      ? true
      : legacyPost.displayMode === "metrics"
        ? false
        : true);
  const showMetrics =
    post.showMetrics ??
    (legacyPost.displayMode === "metrics"
      ? true
      : legacyPost.displayMode === "timestamp"
        ? false
        : false);

  return {
    ...post,
    name: post.name.trim() || "New User",
    username: post.username.trim().replace(/^@+/, "") || "username",
    avatarAssetId: post.avatarAssetId ?? null,
    content: post.content,
    mediaAssetId: post.mediaAssetId ?? null,
    mediaAlt: post.mediaAlt ?? "",
    timestamp: post.timestamp || new Date().toISOString(),
    views: post.views || "0",
    comments: post.comments || "0",
    retweets: post.retweets || "0",
    likes: post.likes || "0",
    bookmarks: post.bookmarks || "0",
    showTimestamp,
    showMetrics,
  };
}

export function normalizeTwitterState(state: TwitterModuleState): TwitterModuleState {
  return {
    ...state,
    theme: state.theme ?? "dim",
    view: state.view ?? "tweet",
    primaryTweet: normalizePost(state.primaryTweet),
    replyChain: (state.replyChain ?? []).map(normalizePost),
  };
}

export function patchTwitterWorkspace(
  state: TwitterModuleState,
  patch: TwitterWorkspacePatch,
) {
  return {
    ...state,
    ...patch,
  };
}

function patchPost(post: TwitterPost, patch: TwitterPostDraft): TwitterPost {
  return normalizePost({
    ...post,
    ...patch,
    avatarAssetId:
      patch.avatarAssetId === undefined ? post.avatarAssetId : patch.avatarAssetId,
    mediaAssetId:
      patch.mediaAssetId === undefined ? post.mediaAssetId : patch.mediaAssetId,
  });
}

export function updatePrimaryTweet(
  state: TwitterModuleState,
  patch: TwitterPostDraft,
) {
  return {
    ...state,
    primaryTweet: patchPost(state.primaryTweet, patch),
  };
}

export function createReplyTweet(
  state: TwitterModuleState,
  draft: TwitterPostDraft = {},
) {
  const reply: TwitterPost = normalizePost({
    id: createId("reply"),
    name: draft.name ?? state.primaryTweet.name,
    username: draft.username ?? state.primaryTweet.username,
    avatarAssetId: draft.avatarAssetId ?? state.primaryTweet.avatarAssetId,
    content: draft.content ?? "",
    mediaAssetId: draft.mediaAssetId ?? null,
    mediaAlt: draft.mediaAlt ?? "",
    timestamp: draft.timestamp ?? new Date().toISOString(),
    views: draft.views ?? "0",
    comments: draft.comments ?? "0",
    retweets: draft.retweets ?? "0",
    likes: draft.likes ?? "0",
    bookmarks: draft.bookmarks ?? "0",
    showTimestamp: draft.showTimestamp ?? true,
    showMetrics: draft.showMetrics ?? false,
  });

  return {
    ...state,
    replyChain: [...state.replyChain, reply],
  };
}

export function updateReplyTweet(
  state: TwitterModuleState,
  tweetId: string,
  patch: TwitterPostDraft,
) {
  return {
    ...state,
    replyChain: state.replyChain.map((tweet) =>
      tweet.id === tweetId ? patchPost(tweet, patch) : tweet,
    ),
  };
}

export function removeReplyTweet(state: TwitterModuleState, tweetId: string) {
  return {
    ...state,
    replyChain: state.replyChain.filter((tweet) => tweet.id !== tweetId),
  };
}

export function moveReplyTweet(
  state: TwitterModuleState,
  tweetId: string,
  direction: "up" | "down",
) {
  const currentIndex = state.replyChain.findIndex((tweet) => tweet.id === tweetId);

  if (currentIndex === -1) {
    return state;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= state.replyChain.length) {
    return state;
  }

  const replyChain = [...state.replyChain];
  const [tweet] = replyChain.splice(currentIndex, 1);
  replyChain.splice(targetIndex, 0, tweet);

  return {
    ...state,
    replyChain,
  };
}
