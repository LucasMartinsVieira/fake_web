"use client";

import { useState } from "react";
import { MessageCircleMore, Plus, Settings2, Trash2, Users } from "lucide-react";
import { useAppContext } from "@/state/app-context";
import { fileToBase64 } from "@/utils/file-to-base64";

function toDateTimeLocalValue(timestamp: string) {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

export function DiscordEditorPanel() {
  const { discordState, discordActions } = useAppContext();
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountColor, setNewAccountColor] = useState("#f2bd62");
  const [newAccountAvatarBase64, setNewAccountAvatarBase64] = useState<string | null>(
    null,
  );
  const [newMessageType, setNewMessageType] = useState<"user" | "system">("user");
  const [newMessageAuthorId, setNewMessageAuthorId] = useState(
    discordState.accounts[0]?.id ?? "",
  );
  const [newMessageContent, setNewMessageContent] = useState("");
  const [newMessageManualTimestamp, setNewMessageManualTimestamp] = useState(false);
  const [newMessageTimestamp, setNewMessageTimestamp] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );

  return (
    <aside className="rounded-[24px] border border-white/10 bg-chrome-950/60 p-4">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
          Discord Editor
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Control panel</h2>
      </div>

      <div className="space-y-4">
        <section className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-discord-accent/15 p-2 text-discord-accent">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-white">Workspace</h3>
              <p className="text-sm text-chrome-300">
                Server and channel labels for the preview.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-chrome-300">Server name</span>
              <input
                type="text"
                value={discordState.serverName}
                onChange={(event) =>
                  discordActions.updateWorkspace({
                    serverName: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-chrome-300">Channel name</span>
              <input
                type="text"
                value={discordState.channelName}
                onChange={(event) =>
                  discordActions.updateWorkspace({
                    channelName: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-discord-accent/15 p-2 text-discord-accent">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-white">Accounts</h3>
              <p className="text-sm text-chrome-300">
                Create and edit Discord identities.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {discordState.accounts.map((account) => (
              <div
                key={account.id}
                className="group relative rounded-2xl border border-white/10 bg-chrome-900/70 p-3"
              >
                <button
                  type="button"
                  onClick={() => discordActions.removeAccount(account.id)}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-chrome-300 opacity-0 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative h-[72px] w-[72px] shrink-0">
                      {account.avatarBase64 ? (
                        <>
                          <img
                            src={account.avatarBase64}
                            alt={account.username}
                            className="h-full w-full rounded-full border border-white/10 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              discordActions.updateAccount(account.id, {
                                avatarBase64: null,
                              })
                            }
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-red-600/80 group-hover:opacity-100"
                          >
                            <Trash2 className="h-6 w-6" />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full cursor-pointer items-center justify-center rounded-full border border-dashed border-white/15 bg-black/20 text-white transition hover:border-discord-accent hover:bg-white/5">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];

                              if (!file) {
                                return;
                              }

                              const avatarBase64 = await fileToBase64(file);
                              discordActions.updateAccount(account.id, {
                                avatarBase64,
                              });
                              event.target.value = "";
                            }}
                            className="sr-only"
                          />
                          <span className="text-lg font-semibold text-white">
                            {account.username.slice(0, 1) || "?"}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-sm text-chrome-300">
                          Username
                        </span>
                        <input
                          type="text"
                          value={account.username}
                          onChange={(event) =>
                            discordActions.updateAccount(account.id, {
                              username: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="block sm:w-[108px]">
                      <span className="mb-1 block text-sm text-chrome-300">
                        Role color
                      </span>
                      <input
                        type="color"
                        value={account.roleColor}
                        onChange={(event) =>
                          discordActions.updateAccount(account.id, {
                            roleColor: event.target.value,
                          })
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-chrome-900 p-1"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-white/10 bg-chrome-900/40 p-3">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-[72px] w-[72px] shrink-0">
                    {newAccountAvatarBase64 ? (
                      <>
                        <img
                          src={newAccountAvatarBase64}
                          alt={newAccountName || "New account avatar"}
                          className="h-full w-full rounded-full border border-white/10 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewAccountAvatarBase64(null)}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-red-600/80"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer items-center justify-center rounded-full border border-dashed border-white/15 bg-black/20 text-white transition hover:border-discord-accent hover:bg-white/5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];

                            if (!file) {
                              return;
                            }

                            const avatarBase64 = await fileToBase64(file);
                            setNewAccountAvatarBase64(avatarBase64);
                            event.target.value = "";
                          }}
                          className="sr-only"
                        />
                        <span className="text-lg font-semibold text-white">
                          {(newAccountName || "?").slice(0, 1)}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-sm text-chrome-300">
                        Username
                      </span>
                      <input
                        type="text"
                        value={newAccountName}
                        onChange={(event) => setNewAccountName(event.target.value)}
                        placeholder="New username"
                        className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="block sm:w-[108px]">
                    <span className="mb-1 block text-sm text-chrome-300">
                      Role color
                    </span>
                    <input
                      type="color"
                      value={newAccountColor}
                      onChange={(event) => setNewAccountColor(event.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-chrome-900 p-1"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newAccountName.trim()) {
                        return;
                      }

                      discordActions.addAccount({
                        username: newAccountName,
                        roleColor: newAccountColor,
                        avatarBase64: newAccountAvatarBase64,
                      });
                      setNewAccountName("");
                      setNewAccountAvatarBase64(null);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-discord-accent bg-discord-accent px-3 py-2 text-sm text-white transition hover:brightness-110 sm:self-end"
                  >
                    <Plus className="h-4 w-4" />
                    Add account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-discord-accent/15 p-2 text-discord-accent">
              <MessageCircleMore className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-white">Messages</h3>
              <p className="text-sm text-chrome-300">
                Compose new messages here. Existing messages are edited from the preview.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-white/10 bg-chrome-900/40 p-3">
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm text-chrome-300">Type</span>
                  <select
                    value={newMessageType}
                    onChange={(event) =>
                      setNewMessageType(event.target.value as "user" | "system")
                    }
                    className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                  >
                    <option value="user">User message</option>
                    <option value="system">System message</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-chrome-300">Author</span>
                  <select
                    value={newMessageAuthorId}
                    onChange={(event) => setNewMessageAuthorId(event.target.value)}
                    disabled={newMessageType === "system"}
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
                  <span className="mb-1 block text-sm text-chrome-300">Content</span>
                  <textarea
                    value={newMessageContent}
                    onChange={(event) => setNewMessageContent(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-sm text-chrome-300">
                  <input
                    type="checkbox"
                    checked={newMessageManualTimestamp}
                    onChange={(event) =>
                      setNewMessageManualTimestamp(event.target.checked)
                    }
                  />
                  Manual timestamp
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-chrome-300">Timestamp</span>
                  <input
                    type="datetime-local"
                    value={newMessageTimestamp}
                    onChange={(event) => setNewMessageTimestamp(event.target.value)}
                    disabled={!newMessageManualTimestamp}
                    className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!newMessageContent.trim()) {
                      return;
                    }

                    discordActions.addMessage({
                      type: newMessageType,
                      authorId: newMessageType === "system" ? null : newMessageAuthorId,
                      content: newMessageContent,
                      manualTimestamp: newMessageManualTimestamp,
                      timestamp: newMessageManualTimestamp
                        ? fromDateTimeLocalValue(newMessageTimestamp)
                        : undefined,
                    });
                    setNewMessageContent("");
                    setNewMessageManualTimestamp(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-discord-accent bg-discord-accent px-3 py-2 text-sm text-white transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Add message
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
