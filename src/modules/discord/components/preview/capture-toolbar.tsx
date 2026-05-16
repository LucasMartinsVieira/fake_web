import { ArrowDown, ArrowUp, Camera, Flag, RotateCcw } from "lucide-react";
import type { DiscordMessage } from "@/modules/discord/state/discord-types";

export function CaptureToolbar({
  captureCount,
  captureCounter,
  capturePrefix,
  captureStatus,
  captureStartMode,
  guideIndex,
  guideMessage,
  isCapturing,
  messageCount,
  onCapture,
  onChangeCounter,
  onChangePrefix,
  onMarkStart,
  onResetRange,
  onResetTarget,
  onStepNext,
  onStepPrev,
  effectiveCaptureStartIndex,
}: {
  captureCount: number;
  captureCounter: number;
  capturePrefix: string;
  captureStatus: string | null;
  captureStartMode: "auto" | "mark";
  guideIndex: number;
  guideMessage: DiscordMessage | null;
  isCapturing: boolean;
  messageCount: number;
  onCapture: () => void;
  onChangeCounter: (value: number) => void;
  onChangePrefix: (value: string) => void;
  onMarkStart: () => void;
  onResetRange: () => void;
  onResetTarget: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  effectiveCaptureStartIndex: number;
}) {
  const actionButtonClassName =
    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-chrome-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white";

  return (
    <div className="mb-4 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-3 shadow-[0_18px_34px_rgba(0,0,0,0.22)]">
      <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-start">
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-2.5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-chrome-500">
            Target
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStepPrev}
              className={actionButtonClassName}
              title="Previous shot target (k)"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onStepNext}
              className={actionButtonClassName}
              title="Next shot target (j)"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onResetTarget}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-chrome-200 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              title="Reset shot target (g)"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-discord-accent/30 bg-discord-accent/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-discord-accent">
              Shot {guideIndex + 1}/{messageCount}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                captureStartMode === "auto"
                  ? "border-discord-accent/40 bg-discord-accent/15 text-discord-accent"
                  : "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
              }`}
            >
              {captureStartMode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-chrome-300">
              Range {effectiveCaptureStartIndex + 1}-{guideIndex + 1}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-chrome-300">
              {captureCount} msgs
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {guideMessage ? guideMessage.authorName : "No message selected"}
              </p>
              <p className="mt-1 text-sm text-chrome-400">
                Grouped-message capture guide with manual mark or auto same-author range.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.2em] text-chrome-400">
              `k/j` nav · `g` reset
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-chrome-500">
            Export
          </p>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px] xl:grid-cols-1">
            <input
              type="text"
              value={capturePrefix}
              onChange={(event) => onChangePrefix(event.target.value)}
              className="h-10 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-discord-accent"
              aria-label="Screenshot filename prefix"
              placeholder="filename"
            />
            <input
              type="number"
              min="1"
              value={captureCounter}
              onChange={(event) =>
                onChangeCounter(Math.max(1, Number(event.target.value)))
              }
              className="h-10 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-discord-accent"
              aria-label="Next screenshot number"
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkStart}
              className={actionButtonClassName}
              title="Set screenshot range start ([)"
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onResetRange}
              className={actionButtonClassName}
              title="Auto-group same-author range (])"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCapture}
              disabled={isCapturing}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-discord-accent bg-discord-accent px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
              title="Download screenshot (c)"
            >
              <Camera className="h-4 w-4" />
              {isCapturing ? "Saving..." : "Save PNG"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="text-xs uppercase tracking-[0.2em] text-chrome-500">
          `[` mark start · `]` auto-group · `c` export png
        </div>
        {captureStatus ? (
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-chrome-300">
            {captureStatus}
          </div>
        ) : null}
      </div>
    </div>
  );
}
