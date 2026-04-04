"use client";

import { useState } from "react";
import { MessageCircleMore, Plus, Settings2, Trash2, Users } from "lucide-react";
import { useAppContext } from "@/state/app-context";

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
                className="rounded-2xl border border-white/10 bg-chrome-900/70 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_88px_auto]">
                  <input
                    type="text"
                    value={account.username}
                    onChange={(event) =>
                      discordActions.updateAccount(account.id, {
                        username: event.target.value,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                  />
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
                  <button
                    type="button"
                    onClick={() => discordActions.removeAccount(account.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-chrome-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-white/10 bg-chrome-900/40 p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_88px_auto]">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(event) => setNewAccountName(event.target.value)}
                  placeholder="New username"
                  className="rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
                />
                <input
                  type="color"
                  value={newAccountColor}
                  onChange={(event) => setNewAccountColor(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-chrome-900 p-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAccountName.trim()) {
                      return;
                    }

                    discordActions.addAccount({
                      username: newAccountName,
                      roleColor: newAccountColor,
                    });
                    setNewAccountName("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-discord-accent bg-discord-accent px-3 py-2 text-sm text-white transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
