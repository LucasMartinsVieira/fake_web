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
  return (
    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.24em] text-chrome-500">
      {children}
    </span>
  );
}

const fieldClassName =
  "w-full min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3 text-white outline-none transition placeholder:text-chrome-500 focus:border-sky-500 focus:bg-black/30";

const iconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-chrome-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

const toggleCardClassName =
  "flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3 text-white transition hover:border-white/20 hover:bg-black/30";

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
    const contentLength = tweet.content.trim().length;

    return (
      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="mb-4 rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(29,155,240,0.12),rgba(255,255,255,0.03))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300/80">
                Post editor
              </p>
              <h3 className="mt-1 text-lg font-medium text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-chrome-300">
                Editable post content for preview.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-right text-[11px] uppercase tracking-[0.2em] text-chrome-500">
                Actions
              </p>
              <div className="flex gap-2">
                {onMoveUp ? (
                  <button
                    type="button"
                    onClick={onMoveUp}
                    className={iconButtonClassName}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                ) : null}
                {onMoveDown ? (
                  <button
                    type="button"
                    onClick={onMoveDown}
                    className={iconButtonClassName}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    onClick={onRemove}
                    className={`${iconButtonClassName} hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-chrome-200">
              {contentLength} chars
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-chrome-200">
              {mediaUrl ? "media on" : "media off"}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-chrome-200">
              @{tweet.username || "username"}
            </span>
            {tweet.showMetrics ? (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-100">
                metrics visible
              </span>
            ) : null}
            {tweet.showTimestamp ? (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-100">
                time visible
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 rounded-[22px] border border-white/10 bg-black/15 p-4 md:grid-cols-[110px_minmax(0,1fr)]">
            <div className="space-y-2 md:space-y-3">
              <SectionLabel>Profile picture</SectionLabel>
              <div className="relative h-24 w-full max-w-[132px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(29,155,240,0.24),rgba(255,255,255,0.04))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:w-24 md:max-w-none">
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
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-chrome-300 transition hover:bg-white/5 hover:text-white">
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
                    <span className="text-[11px] uppercase tracking-[0.2em]">Upload</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              <label className="block">
                <SectionLabel>Name</SectionLabel>
                <input
                  type="text"
                  value={tweet.name}
                  onChange={(event) => onPatch({ name: event.target.value })}
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <SectionLabel>Username</SectionLabel>
                <input
                  type="text"
                  value={tweet.username}
                  onChange={(event) => onPatch({ username: event.target.value })}
                  className={fieldClassName}
                />
              </label>
            </div>

            <label className="block md:col-span-2">
              <SectionLabel>Tweet content</SectionLabel>
              <textarea
                rows={4}
                value={tweet.content}
                onChange={(event) => onPatch({ content: event.target.value })}
                className={`${fieldClassName} min-h-[120px] resize-y leading-6`}
              />
            </label>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <SectionLabel>Attached image</SectionLabel>
                  <p className="text-sm text-chrome-300">Optional media for tweet body.</p>
                </div>
              </div>
              {mediaUrl ? (
                <div className="group relative">
                  <img
                    src={mediaUrl}
                    alt={tweet.mediaAlt || `${tweet.name} media`}
                    className="h-40 w-full rounded-2xl border border-white/10 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onPatch({ mediaAssetId: null, mediaAlt: "" })}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 text-white opacity-0 transition hover:bg-red-600/75 hover:opacity-100 group-hover:opacity-100"
                    aria-label="Remove attached image"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-[176px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] px-4 text-center text-chrome-300 transition hover:border-sky-500 hover:bg-sky-500/5 hover:text-white">
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
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <ImagePlus className="h-4 w-4" />
                    Add image
                  </span>
                  <span className="mt-2 text-xs uppercase tracking-[0.18em] text-chrome-500">
                    Drag feeling, click action
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
                  className={fieldClassName}
                />
              </label>
            </div>

            <div className="space-y-4 rounded-[22px] border border-white/10 bg-black/15 p-4">
              <div>
                <SectionLabel>Time and date</SectionLabel>
                <input
                  type="text"
                  value={tweet.timestamp}
                  onChange={(event) => onPatch({ timestamp: event.target.value })}
                  placeholder="9:41 AM · May 16, 2026"
                  className={fieldClassName}
                />
                <p className="mt-2 text-xs text-chrome-400">
                  Free-form label shown in editor state. Write timestamp text as needed.
                </p>
              </div>

              <div>
                <div className="mb-3">
                  <SectionLabel>Engagement</SectionLabel>
                  <p className="text-sm text-chrome-300">Numbers shown below post body.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <SectionLabel>Views</SectionLabel>
                    <input
                      type="text"
                      value={tweet.views}
                      onChange={(event) => onPatch({ views: event.target.value })}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <SectionLabel>Comments</SectionLabel>
                    <input
                      type="text"
                      value={tweet.comments}
                      onChange={(event) => onPatch({ comments: event.target.value })}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <SectionLabel>Retweets</SectionLabel>
                    <input
                      type="text"
                      value={tweet.retweets}
                      onChange={(event) => onPatch({ retweets: event.target.value })}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <SectionLabel>Likes</SectionLabel>
                    <input
                      type="text"
                      value={tweet.likes}
                      onChange={(event) => onPatch({ likes: event.target.value })}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <SectionLabel>Bookmarks</SectionLabel>
                    <input
                      type="text"
                      value={tweet.bookmarks}
                      onChange={(event) => onPatch({ bookmarks: event.target.value })}
                      className={fieldClassName}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="block">
            <SectionLabel>Bottom row</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={toggleCardClassName}>
                <input
                  type="checkbox"
                  checked={tweet.showTimestamp}
                  onChange={(event) =>
                    onPatch({ showTimestamp: event.target.checked })
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                <span>
                  <span className="block text-sm font-medium">Show time and date</span>
                  <span className="block text-xs text-chrome-400">Render tweet timestamp line.</span>
                </span>
              </label>
              <label className={toggleCardClassName}>
                <input
                  type="checkbox"
                  checked={tweet.showMetrics}
                  onChange={(event) =>
                    onPatch({ showMetrics: event.target.checked })
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                <span>
                  <span className="block text-sm font-medium">Show metrics</span>
                  <span className="block text-xs text-chrome-400">Render views and reaction counts.</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="rounded-[28px] border border-white/10 bg-chrome-950/70 p-4 shadow-panel lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="mb-5 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(29,155,240,0.18),rgba(255,255,255,0.04))] p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">X / Twitter Editor</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tweet composer</h2>
        <p className="mt-2 text-sm leading-6 text-chrome-200">
          Tune tweet metadata, media, reply order. Canvas stays as-is.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-chrome-300">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-chrome-100">
            {twitterState.view === "replyChain" ? "Reply chain view" : "Single view"}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-chrome-100">
            {twitterState.replyChain.length + 1} total posts
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/15 p-2.5 text-sky-400">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-white">Module settings</h3>
              <p className="text-sm text-chrome-300">Choose screen type and canvas theme.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <SectionLabel>Functionality</SectionLabel>
              <select
                value={twitterState.view}
                onChange={(event) =>
                  twitterActions.updateWorkspace({ view: event.target.value as TwitterView })
                }
                className={fieldClassName}
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
                className={fieldClassName}
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

        <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
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
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:brightness-110"
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
              className={fieldClassName}
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
