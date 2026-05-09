import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import type { RefObject } from "react";
import type {
  DiscordAccount,
  DiscordMessage,
} from "@/modules/discord/state/discord-types";
import { formatDiscordTimestamp } from "@/modules/discord/utils/format-discord-timestamp";
import { MessageAttachments, MessageAvatar } from "./shared";
import { renderDiscordMarkdown, shouldGroupMessages } from "./utils";

interface DiscordMessageListProps {
  accounts: DiscordAccount[];
  assetUrls: Record<string, string>;
  mentionColor: string;
  messages: DiscordMessage[];
  captureStartMessageId: string | null;
  captureStartMode: "auto" | "mark";
  guideMessageId: string | null;
  flashMessageId: string | null;
  messageRefs: RefObject<Record<string, HTMLElement | null>>;
  messageListRef: RefObject<HTMLDivElement | null>;
  onEditMessage: (message: DiscordMessage) => void;
  onMoveMessage: (messageId: string, direction: "up" | "down") => void;
}

function getMessageClassName({
  base,
  isGrouped,
  isCaptureStart,
  captureStartMode,
  isFlashing,
}: {
  base: string;
  isGrouped?: boolean;
  isCaptureStart: boolean;
  captureStartMode: "auto" | "mark";
  isFlashing: boolean;
}) {
  return `${base} ${
    isGrouped ? "py-[1px]" : "mt-4 pb-0.5 pt-1 first:mt-0"
  } ${
    isCaptureStart
      ? captureStartMode === "auto"
        ? "ring-1 ring-discord-accent/70 bg-discord-accent/10"
        : "ring-1 ring-emerald-400/70 bg-emerald-400/10"
      : ""
  } ${
    isFlashing ? "bg-[#f0b232]/20 ring-2 ring-[#f0b232]/70" : ""
  }`;
}

function MessageControls({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="discord-message-controls pointer-events-none absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SystemMessageRow({
  message,
  index,
  mentionColor,
  isCaptureStart,
  captureStartMode,
  isFlashing,
  canMoveUp,
  canMoveDown,
  onMoveMessage,
  onEditMessage,
  messageRefs,
}: {
  message: DiscordMessage;
  index: number;
  mentionColor: string;
  isCaptureStart: boolean;
  captureStartMode: "auto" | "mark";
  isFlashing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveMessage: (messageId: string, direction: "up" | "down") => void;
  onEditMessage: (message: DiscordMessage) => void;
  messageRefs: RefObject<Record<string, HTMLElement | null>>;
}) {
  return (
    <article
      key={message.id}
      data-message-index={index}
      ref={(node) => {
        messageRefs.current[message.id] = node;
      }}
      className={`group relative mt-4 rounded-xl px-4 py-2 first:mt-0 transition ${
        isCaptureStart
          ? captureStartMode === "auto"
            ? "ring-1 ring-discord-accent/70 bg-discord-accent/10"
            : "ring-1 ring-emerald-400/70 bg-emerald-400/10"
          : ""
      } ${isFlashing ? "bg-[#f0b232]/20 ring-2 ring-[#f0b232]/70" : ""}`}
    >
      <MessageControls
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={() => onMoveMessage(message.id, "up")}
        onMoveDown={() => onMoveMessage(message.id, "down")}
        onEdit={() => onEditMessage(message)}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/5" />
        <p className="text-center text-xs font-medium text-discord-muted">
          {renderDiscordMarkdown(message.content, mentionColor)}
        </p>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </article>
  );
}

function UserMessageRow({
  message,
  index,
  account,
  avatarUrl,
  mentionColor,
  isGrouped,
  isCaptureStart,
  captureStartMode,
  isFlashing,
  canMoveUp,
  canMoveDown,
  onMoveMessage,
  onEditMessage,
  messageRefs,
}: {
  message: DiscordMessage;
  index: number;
  account: DiscordAccount | undefined;
  avatarUrl: string | null;
  mentionColor: string;
  isGrouped: boolean;
  isCaptureStart: boolean;
  captureStartMode: "auto" | "mark";
  isFlashing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveMessage: (messageId: string, direction: "up" | "down") => void;
  onEditMessage: (message: DiscordMessage) => void;
  messageRefs: RefObject<Record<string, HTMLElement | null>>;
}) {
  return (
    <article
      key={message.id}
      data-message-index={index}
      ref={(node) => {
        messageRefs.current[message.id] = node;
      }}
      className={getMessageClassName({
        base: "group relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 rounded-xl px-4 text-[15px] leading-[1.375rem] transition hover:bg-white/5",
        isGrouped,
        isCaptureStart,
        captureStartMode,
        isFlashing,
      })}
    >
      <MessageControls
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={() => onMoveMessage(message.id, "up")}
        onMoveDown={() => onMoveMessage(message.id, "down")}
        onEdit={() => onEditMessage(message)}
      />

      {!isGrouped ? (
        <>
          <MessageAvatar avatarUrl={avatarUrl} authorName={message.authorName} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium" style={{ color: message.roleColor }}>
                {message.authorName}
              </span>
              <span className="text-xs text-discord-muted">
                {formatDiscordTimestamp(message.timestamp)}
              </span>
            </div>
            <div className="mt-0.5 whitespace-pre-wrap break-words text-discord-text">
              {renderDiscordMarkdown(message.content, mentionColor)}
            </div>
            <MessageAttachments message={message} />
          </div>
        </>
      ) : (
        <>
          <div aria-hidden="true" />
          <div className="min-w-0">
            <div className="whitespace-pre-wrap break-words text-discord-text">
              {renderDiscordMarkdown(message.content, mentionColor)}
            </div>
            <MessageAttachments message={message} />
          </div>
        </>
      )}
    </article>
  );
}

export function DiscordMessageList({
  accounts,
  assetUrls,
  mentionColor,
  messages,
  captureStartMessageId,
  captureStartMode,
  guideMessageId,
  flashMessageId,
  messageRefs,
  messageListRef,
  onEditMessage,
  onMoveMessage,
}: DiscordMessageListProps) {
  return (
    <div ref={messageListRef} className="pr-2">
      {messages.map((message, index) => {
        const account = accounts.find((item) => item.id === message.authorId);
        const previousMessage = messages[index - 1];
        const isGrouped = shouldGroupMessages(previousMessage, message);
        const canMoveUp = index > 0;
        const canMoveDown = index < messages.length - 1;
        const isCaptureStart = captureStartMessageId === message.id;
        const isFlashing = flashMessageId === message.id;

        if (message.type === "system") {
          return (
            <SystemMessageRow
              key={message.id}
              message={message}
              index={index}
              mentionColor={mentionColor}
              isCaptureStart={isCaptureStart}
              captureStartMode={captureStartMode}
              isFlashing={isFlashing}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveMessage={onMoveMessage}
              onEditMessage={onEditMessage}
              messageRefs={messageRefs}
            />
          );
        }

        return (
          <UserMessageRow
            key={message.id}
            message={message}
            index={index}
            account={account}
            avatarUrl={account?.avatarAssetId ? (assetUrls[account.avatarAssetId] ?? null) : null}
            mentionColor={mentionColor}
            isGrouped={isGrouped}
            isCaptureStart={isCaptureStart}
            captureStartMode={captureStartMode}
            isFlashing={isFlashing}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveMessage={onMoveMessage}
            onEditMessage={onEditMessage}
            messageRefs={messageRefs}
          />
        );
      })}
    </div>
  );
}
