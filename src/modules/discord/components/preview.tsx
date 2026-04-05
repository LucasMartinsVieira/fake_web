"use client";

import { createPortal } from "react-dom";
import {
  Fragment,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, Pencil, X } from "lucide-react";
import { useAppContext } from "@/state/app-context";
import type { DiscordMessage } from "@/modules/discord/state/discord-types";
import { formatDiscordTimestamp } from "@/modules/discord/utils/format-discord-timestamp";
import { getAvatarColor } from "@/modules/discord/utils/get-avatar-color";

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

function shouldGroupMessages(
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

function renderDiscordMarkdown(content: string, mentionColor: string) {
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

function renderMentionSpans(
  content: string,
  mentionColor: string,
): ReactNode[] {
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

function MessageAvatar({
  avatarBase64,
  authorName,
}: {
  avatarBase64: string | null;
  authorName: string;
}) {
  if (avatarBase64) {
    return (
      <img
        src={avatarBase64}
        alt={authorName}
        className="mt-0.5 h-10 w-10 rounded-full object-cover"
      />
    );
  }

  const backgroundColor = getAvatarColor(authorName);
  const isYellow = backgroundColor === "#fee75c";

  return (
    <div
      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
        isYellow ? "text-black/70" : "text-white"
      }`}
      style={{ backgroundColor }}
    >
      {authorName.slice(0, 1)}
    </div>
  );
}

function MessageAttachments({ message }: { message: DiscordMessage }) {
  if (!message.attachments.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {message.attachments.map((attachment) => (
        <figure
          key={attachment.id}
          className="max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-black/10"
        >
          <img
            src={attachment.base64}
            alt={attachment.name}
            className="block max-h-[360px] w-full object-cover"
          />
          <figcaption className="border-t border-white/5 px-3 py-2 text-xs text-discord-muted">
            {attachment.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function DiscordPreview() {
  const { canvasScale, discordState, discordActions } = useAppContext();
  const zoomStyle = { zoom: canvasScale } as CSSProperties;
  const theme = discordThemes[discordState.theme];
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"user" | "system">("user");
  const [editingAuthorId, setEditingAuthorId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingManualTimestamp, setEditingManualTimestamp] = useState(false);
  const [editingTimestamp, setEditingTimestamp] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );

  const editingMessage =
    discordState.messages.find((message) => message.id === editingMessageId) ??
    null;
  const editingMentionQuery = getMentionQuery(editingContent);
  const editingMentionSuggestions =
    editingMentionQuery === null
      ? []
      : discordState.accounts.filter((account) =>
          account.username.toLowerCase().startsWith(editingMentionQuery),
        );

  useEffect(() => {
    if (!editingMessage) {
      return;
    }

    setEditingType(editingMessage.type);
    setEditingAuthorId(editingMessage.authorId ?? "");
    setEditingContent(editingMessage.content);
    setEditingManualTimestamp(editingMessage.manualTimestamp);
    setEditingTimestamp(toDateTimeLocalValue(editingMessage.timestamp));
  }, [editingMessage]);

  function openMessageEditor(message: DiscordMessage) {
    setEditingMessageId(message.id);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-chrome-950/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
              Preview
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Discord Web mockup
            </h2>
          </div>
          <p className="text-sm text-chrome-300">
            {discordState.channelName} · {discordState.serverName}
          </p>
        </div>

        <div className="overflow-auto rounded-[20px] bg-discord-panel p-6">
          <div className="mx-auto transition-[zoom]" style={zoomStyle}>
            <div
              className="w-[880px] max-w-full rounded-[16px] p-6"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
              }}
            >
              <div className="mb-6 border-b border-white/5 pb-4">
                <p className="text-lg font-semibold">
                  #{discordState.channelName}
                </p>
                <p className="text-sm text-discord-muted">
                  Mock conversation preview scaffold
                </p>
              </div>

              <div className="max-h-[680px] overflow-y-auto pr-2">
                {discordState.messages.map((message, index) => {
                  const authorAccount = discordState.accounts.find(
                    (account) => account.id === message.authorId,
                  );
                  const previousMessage = discordState.messages[index - 1];
                  const isGrouped = shouldGroupMessages(
                    previousMessage,
                    message,
                  );
                  const canMoveUp = index > 0;
                  const canMoveDown = index < discordState.messages.length - 1;

                  if (message.type === "system") {
                    return (
                      <article
                        key={message.id}
                        className="group relative mt-4 rounded-xl px-4 py-2 first:mt-0"
                      >
                        <div className="pointer-events-none absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() =>
                              discordActions.moveMessage(message.id, "up")
                            }
                            disabled={!canMoveUp}
                            className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              discordActions.moveMessage(message.id, "down")
                            }
                            disabled={!canMoveDown}
                            className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openMessageEditor(message)}
                            className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-white/5" />
                          <p className="text-center text-xs font-medium text-discord-muted">
                            {renderDiscordMarkdown(
                              message.content,
                              theme.mention,
                            )}
                          </p>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={message.id}
                      className={`group relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 rounded-xl px-4 text-[15px] leading-[1.375rem] transition hover:bg-white/5 ${
                        isGrouped ? "py-[1px]" : "mt-4 pb-0.5 pt-1 first:mt-0"
                      }`}
                    >
                      <div className="pointer-events-none absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() =>
                            discordActions.moveMessage(message.id, "up")
                          }
                          disabled={!canMoveUp}
                          className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            discordActions.moveMessage(message.id, "down")
                          }
                          disabled={!canMoveDown}
                          className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openMessageEditor(message)}
                          className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-chrome-950/95 text-chrome-300 transition hover:border-white/20 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {!isGrouped ? (
                        <>
                          <MessageAvatar
                            avatarBase64={authorAccount?.avatarBase64 ?? null}
                            authorName={message.authorName}
                          />
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span
                                className="font-medium"
                                style={{ color: message.roleColor }}
                              >
                                {message.authorName}
                              </span>
                              <span className="text-xs text-discord-muted">
                                {formatDiscordTimestamp(message.timestamp)}
                              </span>
                            </div>
                            <div className="mt-0.5 whitespace-pre-wrap break-words text-discord-text">
                              {renderDiscordMarkdown(
                                message.content,
                                theme.mention,
                              )}
                            </div>
                            <MessageAttachments message={message} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div aria-hidden="true" />
                          <div className="min-w-0">
                            <div className="whitespace-pre-wrap break-words text-discord-text">
                              {renderDiscordMarkdown(
                                message.content,
                                theme.mention,
                              )}
                            </div>
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
        </div>
      </div>

      {editingMessage
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/10 bg-chrome-950 p-5 shadow-panel">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
                      Edit Message
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-white">
                      Update conversation entry
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMessageId(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm text-chrome-300">
                      Type
                    </span>
                    <select
                      value={editingType}
                      onChange={(event) =>
                        setEditingType(event.target.value as "user" | "system")
                      }
                      className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                    >
                      <option value="user">User message</option>
                      <option value="system">System message</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm text-chrome-300">
                      Author
                    </span>
                    <select
                      value={editingAuthorId}
                      onChange={(event) =>
                        setEditingAuthorId(event.target.value)
                      }
                      disabled={editingType === "system"}
                      className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50"
                    >
                      {discordState.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.username}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm text-chrome-300">
                      Content
                    </span>
                    <textarea
                      value={editingContent}
                      onChange={(event) =>
                        setEditingContent(event.target.value)
                      }
                      rows={6}
                      className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                    />
                  </label>

                  {editingMentionSuggestions.length ? (
                    <div className="rounded-xl border border-white/10 bg-chrome-900/80 p-2">
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-chrome-500">
                        Mention Suggestions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {editingMentionSuggestions.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() =>
                              setEditingContent((current) =>
                                applyMention(current, account.username),
                              )
                            }
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                          >
                            @{account.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-sm text-chrome-300">
                    <input
                      type="checkbox"
                      checked={editingManualTimestamp}
                      onChange={(event) =>
                        setEditingManualTimestamp(event.target.checked)
                      }
                    />
                    Manual timestamp
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm text-chrome-300">
                      Timestamp
                    </span>
                    <input
                      type="datetime-local"
                      value={editingTimestamp}
                      onChange={(event) =>
                        setEditingTimestamp(event.target.value)
                      }
                      disabled={!editingManualTimestamp}
                      className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50"
                    />
                  </label>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      discordActions.removeMessage(editingMessage.id);
                      setEditingMessageId(null);
                    }}
                    className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                  >
                    Delete
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingMessageId(null)}
                      className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        discordActions.updateMessage(editingMessage.id, {
                          type: editingType,
                          authorId:
                            editingType === "system" ? null : editingAuthorId,
                          content: editingContent,
                          manualTimestamp: editingManualTimestamp,
                          timestamp: editingManualTimestamp
                            ? fromDateTimeLocalValue(editingTimestamp)
                            : undefined,
                        });
                        setEditingMessageId(null);
                      }}
                      className="inline-flex items-center rounded-xl border border-discord-accent bg-discord-accent px-4 py-2 text-sm text-white transition hover:brightness-110"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
