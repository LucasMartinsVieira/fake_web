import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type {
  DiscordAccount,
  DiscordMessage,
  DiscordMessageType,
} from "@/modules/discord/state/discord-types";

interface EditMessageModalProps {
  accounts: DiscordAccount[];
  editingAuthorId: string;
  editingContent: string;
  editingManualTimestamp: boolean;
  editingMentionSuggestions: DiscordAccount[];
  editingMessage: DiscordMessage | null;
  editingTimestamp: string;
  editingType: DiscordMessageType;
  onApplyMention: (username: string) => void;
  onChangeAuthorId: (value: string) => void;
  onChangeContent: (value: string) => void;
  onChangeManualTimestamp: (value: boolean) => void;
  onChangeTimestamp: (value: string) => void;
  onChangeType: (value: DiscordMessageType) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export function EditMessageModal({
  accounts,
  editingAuthorId,
  editingContent,
  editingManualTimestamp,
  editingMentionSuggestions,
  editingMessage,
  editingTimestamp,
  editingType,
  onApplyMention,
  onChangeAuthorId,
  onChangeContent,
  onChangeManualTimestamp,
  onChangeTimestamp,
  onChangeType,
  onClose,
  onDelete,
  onSave,
}: EditMessageModalProps) {
  if (!editingMessage) {
    return null;
  }

  return createPortal(
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
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-chrome-300">Type</span>
            <select
              value={editingType}
              onChange={(event) => onChangeType(event.target.value as DiscordMessageType)}
              className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent"
            >
              <option value="user">User message</option>
              <option value="system">System message</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-chrome-300">Author</span>
            <select
              value={editingAuthorId}
              onChange={(event) => onChangeAuthorId(event.target.value)}
              disabled={editingType === "system"}
              className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-chrome-300">Content</span>
            <textarea
              value={editingContent}
              onChange={(event) => onChangeContent(event.target.value)}
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
                    onClick={() => onApplyMention(account.username)}
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
              onChange={(event) => onChangeManualTimestamp(event.target.checked)}
            />
            Manual timestamp
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-chrome-300">Timestamp</span>
            <input
              type="datetime-local"
              value={editingTimestamp}
              onChange={(event) => onChangeTimestamp(event.target.value)}
              disabled={!editingManualTimestamp}
              className="w-full rounded-xl border border-white/10 bg-chrome-900 px-3 py-2 text-white outline-none transition focus:border-discord-accent disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center rounded-xl border border-discord-accent bg-discord-accent px-4 py-2 text-sm text-white transition hover:brightness-110"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ResetShotModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-shot-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-[20px] border border-white/10 bg-chrome-950 p-5 shadow-panel">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">Confirm</p>
            <h3 id="reset-shot-title" className="mt-1 text-lg font-semibold text-white">
              Reset shot target?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
            aria-label="Cancel reset"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-6 text-chrome-300">
          `s` requested reset to first message. Press Enter to confirm or Esc to keep
          current target.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-xl border border-discord-accent bg-discord-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Reset
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
