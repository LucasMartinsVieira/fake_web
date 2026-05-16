"use client";

import { Fragment } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { useRef, type CSSProperties } from "react";
import {
  inlineClonedImages,
  nextFrame,
} from "@/modules/discord/components/preview/utils";
import { useAppContext } from "@/state/app-context";
import type {
  TwitterPost,
  TwitterTheme,
} from "@/modules/twitter/state/twitter-types";

type ThemeTokens = {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  subtle: string;
  icon: string;
  header: string;
};

const themeTokens: Record<TwitterTheme, ThemeTokens> = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    border: "#eff3f4",
    text: "#0f1419",
    muted: "#536471",
    subtle: "#f7f9f9",
    icon: "#536d87",
    header: "#cfd9e3",
  },
  dim: {
    background: "#15202b",
    surface: "#15202b",
    border: "#38444d",
    text: "#e7e9ea",
    muted: "#8b98a5",
    subtle: "#1e2732",
    icon: "#8aa0b8",
    header: "#3b4957",
  },
  dark: {
    background: "#000000",
    surface: "#000000",
    border: "#2f3336",
    text: "#e7e9ea",
    muted: "#71767b",
    subtle: "#080808",
    icon: "#8aa0b8",
    header: "#2f3336",
  },
};

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function formatMetaTimestamp(timestamp: string) {
  if (!timestamp.trim()) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const calendar = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return `${time} · ${calendar}`;
}

function formatReplyTimestamp(timestamp: string) {
  if (!timestamp.trim()) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFullTimestamp(timestamp: string) {
  if (!timestamp.trim()) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const calendar = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return `${time} · ${calendar}`;
}

function withAlpha(hex: string, alpha: string) {
  if (!hex.startsWith("#")) {
    return hex;
  }

  if (hex.length === 7) {
    return `${hex}${alpha}`;
  }

  return hex;
}

function renderTweetText(content: string) {
  return content.split(/(@[\w_]+)/g).filter(Boolean).map((part, index) =>
    part.startsWith("@") ? (
      <span key={`${part}-${index}`} style={{ color: "#1D9BF0" }}>
        {part}
      </span>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
}

function Avatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  className?: string;
}) {
  const avatarClassName = className ?? "h-10 w-10 rounded-full object-cover";

  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={avatarClassName} />
  ) : (
    <div
      className={`flex items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white ${avatarClassName}`}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function TweetActions({ color }: { color: string }) {
  const className = "flex flex-1 items-center justify-center";

  return (
    <div
      className="mx-auto mt-0 flex w-full max-w-[540px] items-center justify-between"
      style={{ color }}
    >
      <span className={className}>
        <MessageCircle className="h-5 w-5" />
      </span>
      <span className={className}>
        <Repeat2 className="h-5 w-5" />
      </span>
      <span className={className}>
        <Heart className="h-5 w-5" />
      </span>
      <span className={className}>
        <Share className="h-5 w-5" />
      </span>
    </div>
  );
}

function TweetMedia({
  mediaUrl,
  mediaAlt,
  border,
}: {
  mediaUrl: string | null;
  mediaAlt: string;
  border: string;
}) {
  if (!mediaUrl) {
    return null;
  }

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-2xl border"
      style={{ borderColor: border }}
    >
      <img
        src={mediaUrl}
        alt={mediaAlt || "Tweet media"}
        className="max-h-[520px] w-full object-cover"
      />
      {mediaAlt ? (
        <span className="absolute bottom-3 left-3 rounded-md bg-black/75 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          ALT
        </span>
      ) : null}
    </div>
  );
}

function FullTweetCard({
  tweet,
  tokens,
  assetUrls,
}: {
  tweet: TwitterPost;
  tokens: ThemeTokens;
  assetUrls: Record<string, string>;
}) {
  const avatarUrl = tweet.avatarAssetId
    ? (assetUrls[tweet.avatarAssetId] ?? null)
    : null;
  const mediaUrl = tweet.mediaAssetId
    ? (assetUrls[tweet.mediaAssetId] ?? null)
    : null;

  return (
    <article className="w-full px-4 py-3 sm:px-4 sm:py-4">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                name={tweet.name}
                avatarUrl={avatarUrl}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div
                  className="truncate text-[15px] font-extrabold leading-5"
                  style={{ color: tokens.text }}
                >
                  {tweet.name}
                </div>
                <div
                  className="truncate text-[15px] leading-5"
                  style={{ color: tokens.muted }}
                >
                  @{tweet.username}
                </div>
              </div>
            </div>
            <MoreHorizontal
              className="mt-1 h-5 w-5 shrink-0"
              style={{ color: tokens.muted }}
            />
          </div>

          <div
            className="mt-3 whitespace-pre-wrap text-[18px] font-normal leading-[1.45]"
            style={{ color: tokens.text }}
          >
            {renderTweetText(tweet.content)}
          </div>

          <TweetMedia
            mediaUrl={mediaUrl}
            mediaAlt={tweet.mediaAlt}
            border={tokens.border}
          />

          {tweet.showTimestamp || tweet.showMetrics ? (
            <div className="mt-6">
              {tweet.showTimestamp ? (
                <div className="text-[14px]" style={{ color: tokens.icon }}>
                  {formatFullTimestamp(tweet.timestamp)}
                </div>
              ) : null}

              {tweet.showMetrics ? (
                <div
                  className={tweet.showTimestamp ? "mt-4" : undefined}
                  style={{ color: tokens.muted }}
                >
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
                    <span>
                      <strong
                        className="mr-1 text-[15px]"
                        style={{ color: tokens.text }}
                      >
                        {tweet.comments}
                      </strong>
                      Comments
                    </span>
                    <span>
                      <strong
                        className="mr-1 text-[15px]"
                        style={{ color: tokens.text }}
                      >
                        {tweet.retweets}
                      </strong>
                      Retweets
                    </span>
                    <span>
                      <strong
                        className="mr-1 text-[15px]"
                        style={{ color: tokens.text }}
                      >
                        {tweet.likes}
                      </strong>
                      Likes
                    </span>
                    <span>
                      <strong
                        className="mr-1 text-[15px]"
                        style={{ color: tokens.text }}
                      >
                        {tweet.bookmarks}
                      </strong>
                      Bookmarks
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className="mt-4 border-t pt-4"
            style={{ borderColor: withAlpha(tokens.icon, "55") }}
          >
            <TweetActions color={tokens.icon} />
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactReply({
  tweet,
  tokens,
  assetUrls,
}: {
  tweet: TwitterPost;
  tokens: ThemeTokens;
  assetUrls: Record<string, string>;
}) {
  const avatarUrl = tweet.avatarAssetId
    ? (assetUrls[tweet.avatarAssetId] ?? null)
    : null;
  const mediaUrl = tweet.mediaAssetId
    ? (assetUrls[tweet.mediaAssetId] ?? null)
    : null;

  return (
    <article
      className="relative flex gap-3 px-4 py-4 sm:px-4"
      style={{ borderColor: tokens.border }}
    >
      <div className="relative">
        <div
          className="absolute left-1/2 top-12 -translate-x-1/2"
          style={{
            width: 2,
            height: 52,
            background: tokens.border,
            display: tweet.id === assetUrls.__lastReplyId ? "none" : "block",
          }}
        />
        <Avatar name={tweet.name} avatarUrl={avatarUrl} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[15px] leading-5">
          <span className="truncate font-bold" style={{ color: tokens.text }}>
            {tweet.name}
          </span>
          <span className="truncate" style={{ color: tokens.muted }}>
            @{tweet.username}
          </span>
          <span style={{ color: tokens.muted }}>·</span>
          <span style={{ color: tokens.muted }}>
            {formatReplyTimestamp(tweet.timestamp)}
          </span>
          <MoreHorizontal
            className="ml-auto h-5 w-5 shrink-0"
            style={{ color: tokens.icon }}
          />
        </div>
        <div
          className="mt-1 whitespace-pre-wrap text-[15px] leading-5"
          style={{ color: tokens.text }}
        >
          {renderTweetText(tweet.content)}
        </div>
        <TweetMedia
          mediaUrl={mediaUrl}
          mediaAlt={tweet.mediaAlt}
          border={tokens.border}
        />
        <div className="mt-3 max-w-[78%]">
          <TweetActions color={tokens.icon} />
        </div>
      </div>
    </article>
  );
}

function BlockCard({
  tweet,
  tokens,
  assetUrls,
}: {
  tweet: TwitterPost;
  tokens: ThemeTokens;
  assetUrls: Record<string, string>;
}) {
  const avatarUrl = tweet.avatarAssetId
    ? (assetUrls[tweet.avatarAssetId] ?? null)
    : null;

  return (
    <div>
      <div style={{ background: tokens.header }} className="h-20" />
      <div className="bg-white px-6 pb-10 pt-0">
        <div className="-translate-y-9">
          <img
            src={
              avatarUrl ??
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23d8e0e8'/%3E%3Ccircle cx='48' cy='39' r='18' fill='%2368798c'/%3E%3Cpath d='M18 78c7-13 20-19 30-19s23 6 30 19' fill='%2368798c'/%3E%3C/svg%3E"
            }
            alt={tweet.name}
            className="h-24 w-24 rounded-full border-[5px] border-white object-cover"
          />
        </div>
        <div className="-mt-4 pb-10">
          <div className="text-[22px] font-extrabold text-[#0f1419]">
            {tweet.name}
          </div>
          <div className="mt-2 text-[15px] text-[#657786]">
            @{tweet.username}
          </div>
        </div>
      </div>
      <div className="px-6 py-16 text-center" style={{ background: "#dfe7ef" }}>
        <div className="text-[30px] font-extrabold leading-tight text-[#0f1419]">
          @{tweet.username} blocked you
        </div>
        <p className="mx-auto mt-8 max-w-[520px] text-[16px] leading-9 text-[#657786]">
          You are blocked from following @{tweet.username} and viewing @
          {tweet.username}&rsquo;s Tweets.
        </p>
      </div>
    </div>
  );
}

function ProfileHeader({
  tweet,
  avatarUrl,
}: {
  tweet: TwitterPost;
  avatarUrl: string | null;
}) {
  return (
    <>
      <div className="h-20 bg-[#c7d1db]" />
      <div className="bg-white px-6 pb-10 pt-0">
        <div className="-translate-y-9">
          <img
            src={
              avatarUrl ??
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23d8e0e8'/%3E%3Ccircle cx='48' cy='39' r='18' fill='%2368798c'/%3E%3Cpath d='M18 78c7-13 20-19 30-19s23 6 30 19' fill='%2368798c'/%3E%3C/svg%3E"
            }
            alt={tweet.name}
            className="h-24 w-24 rounded-full border-[5px] border-white object-cover"
          />
        </div>
        <div className="-mt-4 pb-10">
          <div className="text-[22px] font-extrabold text-[#0f1419]">
            {tweet.name}
          </div>
          <div className="mt-2 text-[15px] text-[#657786]">
            @{tweet.username}
          </div>
        </div>
      </div>
    </>
  );
}

function SuspensionCard({
  tweet,
  tokens,
  assetUrls,
}: {
  tweet: TwitterPost;
  tokens: ThemeTokens;
  assetUrls: Record<string, string>;
}) {
  const avatarUrl = tweet.avatarAssetId
    ? (assetUrls[tweet.avatarAssetId] ?? null)
    : null;

  return (
    <div>
      <ProfileHeader tweet={tweet} avatarUrl={avatarUrl} />
      <div className="px-6 py-16 text-center" style={{ background: "#dfe7ef" }}>
        <div className="text-[30px] font-extrabold leading-tight text-[#0f1419]">
          Account suspended
        </div>
        <p className="mx-auto mt-8 max-w-[520px] text-[16px] leading-9 text-[#657786]">
          Twitter suspends accounts that violate the{" "}
          <span className="text-[#1d9bf0]">Twitter Rules.</span>
        </p>
      </div>
    </div>
  );
}

export function TwitterPreview() {
  const { assetUrls, canvasScale, twitterState } = useAppContext();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const zoomStyle = { zoom: canvasScale } as CSSProperties;
  const tokens = themeTokens[twitterState.theme];
  const replyAssetUrls = {
    ...assetUrls,
    __lastReplyId:
      twitterState.replyChain[twitterState.replyChain.length - 1]?.id ?? "",
  };

  async function exportImage() {
    const preview = previewRef.current;

    if (!preview) {
      return;
    }

    try {
      await nextFrame();

      const exportNode = preview.cloneNode(true) as HTMLDivElement;
      exportNode.style.width = `${preview.scrollWidth}px`;
      exportNode.style.minHeight = `${preview.scrollHeight}px`;
      exportNode.style.background = tokens.background;
      exportNode.style.position = "fixed";
      exportNode.style.left = "0";
      exportNode.style.top = "0";
      exportNode.style.pointerEvents = "none";
      exportNode.style.zIndex = "-1";

      document.body.appendChild(exportNode);

      try {
        await inlineClonedImages(exportNode);
        await nextFrame();

        const dataUrl = await toPng(exportNode, {
          cacheBust: true,
          pixelRatio: 3,
          backgroundColor: tokens.background,
          width: preview.scrollWidth,
          height: preview.scrollHeight,
        });

        downloadDataUrl(dataUrl, `fake-web-x-${twitterState.view}.png`);
      } finally {
        exportNode.remove();
      }
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to export image.",
      );
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-chrome-950/60">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
            Live Preview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            X / Twitter canvas
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void exportImage()}
          className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 transition hover:brightness-110"
        >
          <Download className="h-4 w-4" />
          Download image
        </button>
      </div>

      <div className="overflow-auto p-4">
        <div className="mx-auto w-fit origin-top-left" style={zoomStyle}>
          <div
            ref={previewRef}
            className="twitter-chirp-font overflow-hidden border shadow-panel"
            style={{
              width: 660,
              minHeight: 220,
              background: tokens.background,
              borderColor: tokens.border,
            }}
          >
            {twitterState.view === "tweet" ? (
              <FullTweetCard
                tweet={twitterState.primaryTweet}
                tokens={tokens}
                assetUrls={assetUrls}
              />
            ) : null}

            {twitterState.view === "replyChain" ? (
              <div>
                <CompactReply
                  tweet={twitterState.primaryTweet}
                  tokens={tokens}
                  assetUrls={replyAssetUrls}
                />
                {twitterState.replyChain.map((tweet) => (
                  <CompactReply
                    key={tweet.id}
                    tweet={tweet}
                    tokens={tokens}
                    assetUrls={replyAssetUrls}
                  />
                ))}
              </div>
            ) : null}

            {twitterState.view === "block" ? (
              <BlockCard
                tweet={twitterState.primaryTweet}
                tokens={tokens}
                assetUrls={assetUrls}
              />
            ) : null}

            {twitterState.view === "suspension" ? (
              <SuspensionCard
                tweet={twitterState.primaryTweet}
                tokens={tokens}
                assetUrls={assetUrls}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
