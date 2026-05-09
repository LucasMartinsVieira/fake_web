import { Fragment, type ReactNode } from "react";
import type {
  DiscordMessage,
  DiscordTheme,
} from "@/modules/discord/state/discord-types";

export const discordThemes: Record<
  DiscordTheme,
  { background: string; text: string; mention: string }
> = {
  ash: {
    background: "#323339",
    text: "#f3f3f4",
    mention: "#3b3f65",
  },
  dark: {
    background: "#1a1a1e",
    text: "#d9d9dc",
    mention: "#292c51",
  },
};

export function toDateTimeLocalValue(timestamp: string) {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

export function getMentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([\w-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

export function applyMention(value: string, username: string) {
  return value.replace(/(?:^|\s)@([\w-]*)$/, (match) => {
    const prefix = match.startsWith(" ") ? " " : "";
    return `${prefix}@${username} `;
  });
}

export function shouldGroupMessages(
  previousMessage: DiscordMessage | undefined,
  message: DiscordMessage,
) {
  if (!previousMessage) {
    return false;
  }

  if (previousMessage.type === "system" || message.type === "system") {
    return false;
  }

  if (previousMessage.authorId !== message.authorId) {
    return false;
  }

  const previousTime = new Date(previousMessage.timestamp).getTime();
  const currentTime = new Date(message.timestamp).getTime();
  const minutesBetween = (currentTime - previousTime) / 60000;

  return minutesBetween < 8;
}

export function renderDiscordMarkdown(content: string, mentionColor: string) {
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => (
    <Fragment key={`${line}-${lineIndex}`}>
      {renderDiscordInlineMarkdown(line, mentionColor)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

function renderDiscordInlineMarkdown(
  content: string,
  mentionColor: string,
): ReactNode[] {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {renderMentionSpans(part.slice(2, -2), mentionColor)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="italic">
          {renderMentionSpans(part.slice(1, -1), mentionColor)}
        </em>
      );
    }

    return (
      <Fragment key={`${part}-${index}`}>
        {renderMentionSpans(part, mentionColor)}
      </Fragment>
    );
  });
}

function renderMentionSpans(content: string, mentionColor: string): ReactNode[] {
  return content
    .split(/(@[\w-]+)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("@") ? (
        <span
          key={`${part}-${index}`}
          className="rounded px-1 py-0.5 font-medium"
          style={{ backgroundColor: mentionColor }}
        >
          {part}
        </span>
      ) : (
        <Fragment key={`${part}-${index}`}>{part}</Fragment>
      ),
    );
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

export function getCaptureRunStartIndex(
  messages: DiscordMessage[],
  endIndex: number,
) {
  let startIndex = endIndex;

  while (
    startIndex > 0 &&
    shouldGroupMessages(messages[startIndex - 1], messages[startIndex])
  ) {
    startIndex -= 1;
  }

  return startIndex;
}

export function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function nextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function inlineClonedImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (!img.src || img.src.startsWith("data:")) {
            resolve();
            return;
          }

          const source = new Image();
          source.crossOrigin = "anonymous";
          source.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = source.naturalWidth;
            canvas.height = source.naturalHeight;
            canvas.getContext("2d")?.drawImage(source, 0, 0);
            img.src = canvas.toDataURL("image/png");
            resolve();
          };
          source.onerror = () => resolve();
          source.src = img.src;
        }),
    ),
  );
}
