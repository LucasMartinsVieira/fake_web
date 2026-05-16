"use client";

import { useEffect, useState } from "react";
import {
  AtSign,
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useAppContext } from "@/state/app-context";
import { saveAssetFile } from "@/state/asset-storage";
import type {
  TwitterPost,
  TwitterTheme,
  TwitterView,
} from "@/modules/twitter/state/twitter-types";

function toDateTimeLocalValue(timestamp: string) {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function SectionLabel({ children }: { children: string }) {
  return <span className="mb-1 block text-sm text-chrome-300">{children}</span>;
}

export function TwitterEditorPanel() {
  const { assetUrls, twitterActions, twitterState } = useAppContext();
  const [newReplyTimestamp, setNewReplyTimestamp] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );

  useEffect(() => {
    if (!twitterState.replyChain.length) {
      setNewReplyTimestamp(toDateTimeLocalValue(new Date().toISOString()));
    }
  }, [twitterState.replyChain.length]);

  async function uploadPostAsset(
    file: File | null | undefined,
    update: (assetId: string) => void,
  ) {
    if (!file) {
      return;
    }

    const assetId = await saveAssetFile(file);
    update(assetId);
  }

  function renderPostFields({
    title,
    tweet,
    onPatch,
    onRemove,
    onMoveUp,
    onMoveDown,
  }: {
    title: string;
    tweet: TwitterPost;
    onPatch: (patch: Partial<TwitterPost>) => void;
    onRemove?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
  }) {
    const avatarUrl = tweet.avatarAssetId ? (assetUrls[tweet.avatarAssetId] ?? null) : null;
    const mediaUrl = tweet.mediaAssetId ? (assetUrls[tweet.mediaAssetId] ?? null) : null;

    return (
      <div className="rounded-2xl border border-white/10 bg-chrome-900/60 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-sm text-chrome-300">Editable post content for the preview.</p>
          </div>
          <div className="flex gap-2">
            {onMoveUp ? (
              <button
                type="button"
                onClick={onMoveUp}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            ) : null}
            {onMoveDown ? (
              <button
                type="button"
                onClick={onMoveDown}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
            <div className="space-y-2">
              <SectionLabel>Profile picture</SectionLabel>
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-black/20">
                {avatarUrl ? (
                  <>
                    <img src={avatarUrl} alt={tweet.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onPatch({ avatarAssetId: null })}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition hover:bg-red-600/75 hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full cursor-pointer items-center justify-center text-chrome-300 transition hover:bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (event) => {
                        await uploadPostAsset(event.target.files?.[0], (assetId) =>
                          onPatch({ avatarAssetId: assetId }),
                        );
                        event.target.value = "";
                      }}
                    />
                    <AtSign className="h-5 w-5" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <SectionLabel>Name</SectionLabel>
                <input
                  type="text"
                  value={tweet.name}
                  onChange={(event) => onPatch({ name: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block">
                <SectionLabel>Username</SectionLabel>
                <input
                  type="text"
                  value={tweet.username}
                  onChange={(event) => onPatch({ username: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <SectionLabel>Tweet content</SectionLabel>
                <textarea
                  rows={4}
                  value={tweet.content}
                  onChange={(event) => onPatch({ content: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>Attached image</SectionLabel>
                {mediaUrl ? (
                  <button
                    type="button"
                    onClick={() => onPatch({ mediaAssetId: null, mediaAlt: "" })}
                    className="text-xs text-red-200 transition hover:text-red-100"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt={tweet.mediaAlt || `${tweet.name} media`}
                  className="h-40 w-full rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <label className="flex h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-chrome-300 transition hover:border-sky-500 hover:text-white">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (event) => {
                      await uploadPostAsset(event.target.files?.[0], (assetId) =>
                        onPatch({ mediaAssetId: assetId }),
                      );
                      event.target.value = "";
                    }}
                  />
                  <span className="inline-flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add image
                  </span>
                </label>
              )}
              <label className="mt-3 block">
                <SectionLabel>Tag image</SectionLabel>
                <input
                  type="text"
                  value={tweet.mediaAlt}
                  onChange={(event) => onPatch({ mediaAlt: event.target.value })}
                  placeholder="Describe the image"
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <SectionLabel>Time and date</SectionLabel>
                <input
                  type="datetime-local"
                  value={toDateTimeLocalValue(tweet.timestamp)}
                  onChange={(event) =>
                    onPatch({ timestamp: new Date(event.target.value).toISOString() })
                  }
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block">
                <SectionLabel>Views</SectionLabel>
                <input
                  type="text"
                  value={tweet.views}
                  onChange={(event) => onPatch({ views: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block">
                <SectionLabel>Comments</SectionLabel>
                <input
                  type="text"
                  value={tweet.comments}
                  onChange={(event) => onPatch({ comments: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block">
                <SectionLabel>Retweets</SectionLabel>
                <input
                  type="text"
                  value={tweet.retweets}
                  onChange={(event) => onPatch({ retweets: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block">
                <SectionLabel>Likes</SectionLabel>
                <input
                  type="text"
                  value={tweet.likes}
                  onChange={(event) => onPatch({ likes: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <SectionLabel>Bookmarks</SectionLabel>
                <input
                  type="text"
                  value={tweet.bookmarks}
                  onChange={(event) => onPatch({ bookmarks: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              </label>
            </div>
          </div>

          <div className="block">
            <SectionLabel>Bottom row</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-chrome-900 px-3 py-3 text-white">
                <input
                  type="checkbox"
                  checked={tweet.showTimestamp}
                  onChange={(event) =>
                    onPatch({ showTimestamp: event.target.checked })
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                <span className="text-sm">Show time and date</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-chrome-900 px-3 py-3 text-white">
                <input
                  type="checkbox"
                  checked={tweet.showMetrics}
                  onChange={(event) =>
                    onPatch({ showMetrics: event.target.checked })
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                <span className="text-sm">Show metrics</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="rounded-[24px] border border-white/10 bg-chrome-950/60 p-4">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">X / Twitter Editor</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Tweet composer</h2>
      </div>

      <div className="space-y-4">
        <section className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/15 p-2 text-sky-400">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-white">Module settings</h3>
              <p className="text-sm text-chrome-300">Choose the X/Twitter screen and background theme.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block">
              <SectionLabel>Functionality</SectionLabel>
              <select
                value={twitterState.view}
                onChange={(event) =>
                  twitterActions.updateWorkspace({ view: event.target.value as TwitterView })
                }
                className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
              >
                <option value="tweet">Regular Tweet</option>
                <option value="replyChain">Reply Chain</option>
                <option value="block">Block</option>
                <option value="suspension">Suspension</option>
              </select>
            </label>

            <label className="block">
              <SectionLabel>Background color</SectionLabel>
              <select
                value={twitterState.theme}
                onChange={(event) =>
                  twitterActions.updateWorkspace({ theme: event.target.value as TwitterTheme })
                }
                className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
              >
                <option value="light">Light · #ffffff</option>
                <option value="dim">Dim · #15202b</option>
                <option value="dark">Dark · #000000</option>
              </select>
            </label>
          </div>
        </section>

        {renderPostFields({
          title: "Primary tweet",
          tweet: twitterState.primaryTweet,
          onPatch: (patch) => twitterActions.updatePrimaryTweet(patch),
        })}

        <section className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-white">Reply chain</h3>
              <p className="text-sm text-chrome-300">Used by the Reply Chain view.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                twitterActions.createReplyTweet({
                  name: twitterState.primaryTweet.name,
                  username: twitterState.primaryTweet.username,
                  avatarAssetId: twitterState.primaryTweet.avatarAssetId,
                  timestamp: new Date(newReplyTimestamp).toISOString(),
                  content: "New reply",
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-sm text-sky-100 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add reply
            </button>
          </div>

          <label className="mb-4 block">
            <SectionLabel>Default timestamp for next reply</SectionLabel>
            <input
              type="datetime-local"
              value={newReplyTimestamp}
              onChange={(event) => setNewReplyTimestamp(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-sky-500"
            />
          </label>

          <div className="space-y-3">
            {twitterState.replyChain.map((tweet, index) =>
              renderPostFields({
                title: `Reply ${index + 1}`,
                tweet,
                onPatch: (patch) => twitterActions.updateReplyTweet(tweet.id, patch),
                onRemove: () => twitterActions.removeReplyTweet(tweet.id),
                onMoveUp:
                  index > 0 ? () => twitterActions.moveReplyTweet(tweet.id, "up") : undefined,
                onMoveDown:
                  index < twitterState.replyChain.length - 1
                    ? () => twitterActions.moveReplyTweet(tweet.id, "down")
                    : undefined,
              }),
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
