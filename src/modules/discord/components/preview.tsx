"use client";

import { createPortal } from "react-dom";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, Gift, Pencil, Plus, X } from "lucide-react";
import { useAppContext } from "@/state/app-context";
import type { DiscordAccount, DiscordMessage, DiscordUserStatus } from "@/modules/discord/state/discord-types";
import { formatDiscordTimestamp } from "@/modules/discord/utils/format-discord-timestamp";
import { getAvatarColor } from "@/modules/discord/utils/get-avatar-color";
import { calculateStoryDuration, formatDurationEstimate } from "@/modules/discord/utils/calculate-story-duration";

const discordThemes = {
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
} as const;

function toDateTimeLocalValue(timestamp: string) {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function getMentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([\w-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function applyMention(value: string, username: string) {
  return value.replace(/(?:^|\s)@([\w-]*)$/, (match) => {
    const prefix = match.startsWith(" ") ? " " : "";
    return `${prefix}@${username} `;
  });
}

function shouldGroupMessages(previousMessage: DiscordMessage | undefined, message: DiscordMessage) {
  if (!previousMessage) return false;
  if (previousMessage.type === "system" || message.type === "system") return false;
  if (previousMessage.authorId !== message.authorId) return false;

  const previousTime = new Date(previousMessage.timestamp).getTime();
  const currentTime = new Date(message.timestamp).getTime();
  return (currentTime - previousTime) / 60000 < 8;
}

function renderDiscordMarkdown(content: string, mentionColor: string) {
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => (
    <Fragment key={`${line}-${lineIndex}`}>
      {renderDiscordInlineMarkdown(line, mentionColor)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

function renderDiscordInlineMarkdown(content: string, mentionColor: string): ReactNode[] {
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

    return <Fragment key={`${part}-${index}`}>{renderMentionSpans(part, mentionColor)}</Fragment>;
  });
}

function renderMentionSpans(content: string, mentionColor: string): ReactNode[] {
  return content
    .split(/(@[\w-]+)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("@") ? (
        <span key={`${part}-${index}`} className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: mentionColor }}>
          {part}
        </span>
      ) : (
        <Fragment key={`${part}-${index}`}>{part}</Fragment>
      ),
    );
}

function UserStatusIcon({ status, className = "" }: { status: DiscordUserStatus; className?: string }) {
  switch (status) {
    case "online":
      return <div className={`h-full w-full rounded-full bg-[#23a55a] ${className}`} />;
    case "idle":
      return (
        <div className={`relative h-full w-full rounded-full bg-[#f0b232] ${className}`}>
          <div className="absolute -left-1.5 -top-1.5 h-4 w-4 rounded-full" style={{ backgroundColor: "inherit", filter: "brightness(0.5)" }} />
        </div>
      );
    case "dnd":
      return (
        <div className={`flex h-full w-full items-center justify-center rounded-full bg-[#da3e44] ${className}`}>
          <div className="h-[2.5px] w-[8px] rounded-full bg-black" />
        </div>
      );
    case "invisible":
      return <div className={`h-full w-full rounded-full border-2 border-[#84858d] bg-transparent ${className}`} />;
    default:
      return null;
  }
}

function MessageAvatar({ avatarUrl, authorName, status, statusBg }: { avatarUrl: string | null; authorName: string; status?: DiscordUserStatus; statusBg?: string; }) {
  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt={authorName} className="h-full w-full rounded-full object-cover" />
  ) : (
    <div className={`flex h-full w-full items-center justify-center rounded-full font-semibold ${getAvatarColor(authorName) === "#fee75c" ? "text-black/70" : "text-white"}`} style={{ backgroundColor: getAvatarColor(authorName) }}>
      {authorName.slice(0, 1)}
    </div>
  );

  return (
    <div className="relative mt-0.5 h-10 w-10 shrink-0">
      {avatar}
      {status ? (
        <div className="absolute -bottom-[2px] -right-[2px] h-[18px] w-[18px] rounded-full p-[3px]" style={{ backgroundColor: statusBg }}>
          <UserStatusIcon status={status} />
        </div>
      ) : null}
    </div>
  );
}

function MessageAttachments({ message }: { message: DiscordMessage }) {
  const { assetUrls } = useAppContext();

  if (!message.attachments.length) return null;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {message.attachments.map((attachment) => (
        <figure key={attachment.id} className="max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-black/10">
          {attachment.assetId && assetUrls[attachment.assetId] ? (
            <img src={assetUrls[attachment.assetId]} alt={attachment.name} className="block max-h-[360px] w-full object-cover" />
          ) : null}
          <figcaption className="border-t border-white/5 px-3 py-2 text-xs text-discord-muted">{attachment.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-0.5">
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
      <span className="discord-typing-dot h-2 w-2 rounded-full bg-[#d4d8dd] will-change-[opacity,transform]" />
    </div>
  );
}

function ChatInputAction({ children, className = "" }: { children: ReactNode; className?: string; }) {
  return (
    <button type="button" className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[#b5bac1] transition hover:text-[#dbdee1] ${className}`}>
      {children}
    </button>
  );
}

function ChatInputPreview({ channelName, inputTargetUsername, typingUsername, value, onChange }: { channelName: string; inputTargetUsername: string | null; typingUsername: string | null; value: string; onChange: (value: string) => void; }) {
  const placeholder = inputTargetUsername ? `Message @${inputTargetUsername}` : `Message #${channelName}`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <div className="mt-4 px-4 pb-1">
      <div className="mb-1.5 ml-2 min-h-6 text-[12px] leading-4 text-[#949ba4]">
        {typingUsername ? (
          <div className="flex items-center gap-4">
            <TypingDots />
            <span><span className="font-bold text-[#ffffff]">{typingUsername}</span> is typing...</span>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-[44px] items-start gap-2 rounded-lg bg-[#383a40] pl-3 pr-2 text-[#dbdee1] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <ChatInputAction className="mt-[6px] h-6 w-6 self-start text-[#b5bac1] hover:text-[#dbdee1]"><Plus className="h-[22px] w-[22px] fill-current stroke-[1.75]" /></ChatInputAction>
        <textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} rows={1} placeholder={placeholder} className="min-h-[22px] flex-1 resize-none overflow-hidden bg-transparent py-[11px] text-[15px] leading-[22px] text-[#dbdee1] outline-none placeholder:text-[#949ba4]" />
        <div className="mt-[6px] flex shrink-0 items-center gap-0.5 self-start">
          <ChatInputAction><Gift className="h-5 w-5 stroke-[1.85]" /></ChatInputAction>
          <ChatInputAction className="text-[12px] font-semibold tracking-[0.02em]">GIF</ChatInputAction>
          <ChatInputAction><span className="relative block h-[18px] w-[18px] rounded-[4px] border-2 border-current"><span className="absolute right-[-2px] top-[-2px] h-[7px] w-[7px] rounded-sm border-b-2 border-l-2 border-current bg-[#383a40]" /></span></ChatInputAction>
          <ChatInputAction className="text-[18px] leading-none">☺</ChatInputAction>
        </div>
      </div>
    </div>
  );
}

function MemberList({ accounts, assetUrls, statusBg, isFullWidth = false }: { accounts: DiscordAccount[]; assetUrls: Record<string, string>; statusBg: string; isFullWidth?: boolean; }) {
  const onlineAccounts = accounts.filter((account) => account.status !== "invisible");
  const offlineAccounts = accounts.filter((account) => account.status === "invisible");

  return (
    <div className={`${isFullWidth ? "w-full" : "w-60 shrink-0"} overflow-y-auto px-2 py-4`}>
      <div className="mb-6">
        <h3 className="mb-2 px-2 text-sm font-semibold tracking-wider text-discord-muted">Online — {onlineAccounts.length}</h3>
        <div className="space-y-0.5">
          {onlineAccounts.map((account) => (
            <div key={account.id} className="group flex items-center gap-3 rounded px-2 py-1.5 transition hover:bg-white/5">
              <MessageAvatar avatarUrl={account.avatarAssetId ? (assetUrls[account.avatarAssetId] ?? null) : null} authorName={account.username} status={account.status} statusBg={statusBg} />
              <span className="truncate font-medium opacity-90 group-hover:opacity-100" style={{ color: account.roleColor }}>{account.username}</span>
            </div>
          ))}
        </div>
      </div>

      {offlineAccounts.length > 0 ? (
        <div>
          <h3 className="mb-2 px-2 text-sm font-semibold tracking-wider text-discord-muted">Offline — {offlineAccounts.length}</h3>
          <div className="space-y-0.5">
            {offlineAccounts.map((account) => (
              <div key={account.id} className="group flex items-center gap-3 rounded px-2 py-1.5 transition hover:bg-white/5 opacity-35 grayscale-[0.5]">
                <MessageAvatar avatarUrl={account.avatarAssetId ? (assetUrls[account.avatarAssetId] ?? null) : null} authorName={account.username} />
                <span className="truncate font-medium text-discord-muted">{account.username}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DiscordPreview() {
  const { assetUrls, canvasScale, discordState, discordActions, activeStoryPart, setActiveStoryPart } = useAppContext();
  const zoomStyle = { zoom: canvasScale } as CSSProperties;
  const theme = discordThemes[activeStoryPart.theme];
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<"chat" | "members" | "input">("chat");
  const [editingType, setEditingType] = useState<"user" | "system">("user");
  const [editingAuthorId, setEditingAuthorId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingManualTimestamp, setEditingManualTimestamp] = useState(false);
  const [editingTimestamp, setEditingTimestamp] = useState(toDateTimeLocalValue(new Date().toISOString()));
  const [chatInputValue, setChatInputValue] = useState("");

  const partIndex = Math.max(discordState.parts.findIndex((part) => part.id === activeStoryPart.id), 0);
  const activeMessages = activeStoryPart.messages;
  const editingMessage = activeMessages.find((message) => message.id === editingMessageId) ?? null;
  const editingMentionQuery = getMentionQuery(editingContent);
  const editingMentionSuggestions = editingMentionQuery === null ? [] : discordState.accounts.filter((account) => account.username.toLowerCase().startsWith(editingMentionQuery));
  const inputTargetAccount = discordState.accounts.find((account) => account.id === activeStoryPart.inputTargetAccountId) ?? null;
  const typingAccount = discordState.accounts.find((account) => account.id === activeStoryPart.typingAccountId) ?? null;
  const durationSummary = calculateStoryDuration(discordState);
  const activeDuration = durationSummary.parts.find((entry) => entry.part.id === activeStoryPart.id)?.estimate ?? durationSummary.total;

  useEffect(() => {
    setEditingMessageId(null);
  }, [activeStoryPart.id]);

  useEffect(() => {
    if (!editingMessage) return;
    setEditingType(editingMessage.type);
    setEditingAuthorId(editingMessage.authorId ?? "");
    setEditingContent(editingMessage.content);
    setEditingManualTimestamp(editingMessage.manualTimestamp);
    setEditingTimestamp(toDateTimeLocalValue(editingMessage.timestamp));
  }, [editingMessage]);

  function openMessageEditor(message: DiscordMessage) {
    setEditingMessageId(message.id);
  }

  const previousPart = discordState.parts[Math.max(partIndex - 1, 0)] ?? activeStoryPart;
  const nextPart = discordState.parts[Math.min(partIndex + 1, discordState.parts.length - 1)] ?? activeStoryPart;

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-chrome-950/40 p-4">
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">Preview</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Discord Web mockup</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setActiveStoryPart(previousPart.id)} disabled={partIndex <= 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white">{activeStoryPart.label} · {partIndex + 1}/{discordState.parts.length}</div>
              <button type="button" onClick={() => setActiveStoryPart(nextPart.id)} disabled={partIndex >= discordState.parts.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-chrome-300">
            <div className="rounded-xl bg-black/20 px-3 py-2 text-white">Current part: {formatDurationEstimate(activeDuration.withSystem.minSeconds, activeDuration.withSystem.expectedSeconds, activeDuration.withSystem.maxSeconds)} with SYSTEM / {formatDurationEstimate(activeDuration.withoutSystem.minSeconds, activeDuration.withoutSystem.expectedSeconds, activeDuration.withoutSystem.maxSeconds)} without SYSTEM</div>
            <div className="rounded-xl bg-black/20 px-3 py-2 text-white">Whole story: {formatDurationEstimate(durationSummary.total.withSystem.minSeconds, durationSummary.total.withSystem.expectedSeconds, durationSummary.total.withSystem.maxSeconds)} with SYSTEM / {formatDurationEstimate(durationSummary.total.withoutSystem.minSeconds, durationSummary.total.withoutSystem.expectedSeconds, durationSummary.total.withoutSystem.maxSeconds)} without SYSTEM</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {durationSummary.parts.map((entry, index) => (
              <button key={entry.part.id} type="button" onClick={() => setActiveStoryPart(entry.part.id)} className={`rounded-full border px-3 py-1.5 text-sm transition ${entry.part.id === activeStoryPart.id ? "border-discord-accent bg-discord-accent text-white" : "border-white/10 bg-white/5 text-chrome-300 hover:border-white/20 hover:bg-white/10 hover:text-white"}`}>
                {index + 1}. {entry.part.label} · {formatDurationEstimate(entry.estimate.withSystem.minSeconds, entry.estimate.withSystem.expectedSeconds, entry.estimate.withSystem.maxSeconds)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl bg-chrome-900/50 p-1">
              <button type="button" onClick={() => setPreviewView("chat")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${previewView === "chat" ? "bg-discord-accent text-white shadow-sm" : "text-chrome-300 hover:text-white"}`}>Chat</button>
              <button type="button" onClick={() => setPreviewView("members")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${previewView === "members" ? "bg-discord-accent text-white shadow-sm" : "text-chrome-300 hover:text-white"}`}>Member List</button>
              <button type="button" onClick={() => setPreviewView("input")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${previewView === "input" ? "bg-discord-accent text-white shadow-sm" : "text-chrome-300 hover:text-white"}`}>Chat Input</button>
            </div>

            <p className="text-sm text-chrome-300">{activeStoryPart.channelName} · {activeStoryPart.serverName}</p>
          </div>
        </div>

        <div className="overflow-auto rounded-[20px] bg-discord-panel p-6">
          <div className="mx-auto transition-[zoom]" style={zoomStyle}>
            <div className="w-[880px] max-w-full overflow-hidden rounded-[16px]" style={{ backgroundColor: theme.background, color: theme.text }}>
              {previewView === "chat" ? (
                <div className="flex min-h-[760px] flex-col">
                  <div className="border-b border-white/5 px-6 pb-4 pt-6">
                    <p className="text-lg font-semibold">#{activeStoryPart.channelName}</p>
                    <p className="text-sm text-discord-muted">{activeStoryPart.serverName} · {activeStoryPart.label}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pt-6">
                    <div className="pr-2">
                      {activeMessages.map((message, index) => {
                        const authorAccount = discordState.accounts.find((account) => account.id === message.authorId);
                        const previousMessage = activeMessages[index - 1];
                        const isGrouped = shouldGroupMessages(previousMessage, message);
                        const canMoveUp = index > 0;
                        const canMoveDown = index < activeMessages.length - 1;

                        if (message.type === "system") {
                          return (
                            <article key={message.id} className="group relative mt-4 rounded-xl px-4 py-2 first:mt-0">
                              <div className="pointer-events-none absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                <button type="button" onClick={() => discordActions.moveMessage(message.id, "up")} disabled={!canMoveUp} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => discordActions.moveMessage(message.id, "down")} disabled={!canMoveDown} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => openMessageEditor(message)} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-white/5" />
                                <p className="text-center text-xs font-medium text-discord-muted">{renderDiscordMarkdown(message.content, theme.mention)}</p>
                                <div className="h-px flex-1 bg-white/5" />
                              </div>
                            </article>
                          );
                        }

                        return (
                          <article key={message.id} className={`group relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 rounded-xl px-4 text-[15px] leading-[1.375rem] transition hover:bg-white/5 ${isGrouped ? "py-[1px]" : "mt-4 pb-0.5 pt-1 first:mt-0"}`}>
                            <div className="pointer-events-none absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                              <button type="button" onClick={() => discordActions.moveMessage(message.id, "up")} disabled={!canMoveUp} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => discordActions.moveMessage(message.id, "down")} disabled={!canMoveDown} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => openMessageEditor(message)} className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                            </div>
                            {!isGrouped ? (
                              <>
                                <MessageAvatar avatarUrl={authorAccount?.avatarAssetId ? (assetUrls[authorAccount.avatarAssetId] ?? null) : null} authorName={message.authorName} />
                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-medium" style={{ color: message.roleColor }}>{message.authorName}</span>
                                    <span className="text-xs text-discord-muted">{formatDiscordTimestamp(message.timestamp)}</span>
                                  </div>
                                  <div className="mt-0.5 whitespace-pre-wrap break-words text-discord-text">{renderDiscordMarkdown(message.content, theme.mention)}</div>
                                  <MessageAttachments message={message} />
                                </div>
                              </>
                            ) : (
                              <>
                                <div aria-hidden="true" />
                                <div className="min-w-0">
                                  <div className="whitespace-pre-wrap break-words text-discord-text">{renderDiscordMarkdown(message.content, theme.mention)}</div>
                                  <MessageAttachments message={message} />
                                </div>
                              </>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : previewView === "input" ? (
                <div className="min-h-[360px] p-6">
                  <ChatInputPreview channelName={activeStoryPart.channelName} inputTargetUsername={inputTargetAccount?.username ?? null} typingUsername={typingAccount?.username ?? null} value={chatInputValue} onChange={setChatInputValue} />
                </div>
              ) : (
                <div className="flex-1 p-6">
                  <MemberList accounts={discordState.accounts} assetUrls={assetUrls} statusBg={theme.background} isFullWidth />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingMessage ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/10 bg-chrome-950 p-5 shadow-panel">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">Edit Message</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Update conversation entry</h3>
              </div>
              <button type="button" onClick={() => setEditingMessageId(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="block">
                <span className="mb-1 block text-sm text-chrome-300">Type</span>
                <select value={editingType} onChange={(event) => setEditingType(event.target.value as "user" | "system")} className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent">
                  <option value="user">User message</option>
                  <option value="system">System message</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-chrome-300">Author</span>
                <select value={editingAuthorId} onChange={(event) => setEditingAuthorId(event.target.value)} disabled={editingType === "system"} className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50">
                  {discordState.accounts.map((account) => <option key={account.id} value={account.id}>{account.username}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-chrome-300">Content</span>
                <textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} rows={6} className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent" />
              </label>

              {editingMentionSuggestions.length ? (
                <div className="rounded-xl border border-white/10 bg-chrome-900/80 p-2">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-chrome-500">Mention Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {editingMentionSuggestions.map((account) => (
                      <button key={account.id} type="button" onClick={() => setEditingContent((current) => applyMention(current, account.username))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">@{account.username}</button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-sm text-chrome-300">
                <input type="checkbox" checked={editingManualTimestamp} onChange={(event) => setEditingManualTimestamp(event.target.checked)} />
                Manual timestamp
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-chrome-300">Timestamp</span>
                <input type="datetime-local" value={editingTimestamp} onChange={(event) => setEditingTimestamp(event.target.value)} disabled={!editingManualTimestamp} className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50" />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={() => { discordActions.removeMessage(editingMessage.id); setEditingMessageId(null); }} className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200">Delete</button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingMessageId(null)} className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:text-white">Cancel</button>
                <button type="button" onClick={() => { discordActions.updateMessage(editingMessage.id, { type: editingType, authorId: editingType === "system" ? null : editingAuthorId, content: editingContent, manualTimestamp: editingManualTimestamp, timestamp: editingManualTimestamp ? fromDateTimeLocalValue(editingTimestamp) : undefined, }); setEditingMessageId(null); }} className="inline-flex items-center rounded-xl border border-discord-accent bg-discord-accent px-4 py-2 text-sm text-white transition hover:brightness-110">Save changes</button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
