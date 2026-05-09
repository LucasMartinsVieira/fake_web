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
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onStepPrev}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-chrome-300 transition hover:border-white/20 hover:text-white"
          title="Previous shot target (k)"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onStepNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-chrome-300 transition hover:border-white/20 hover:text-white"
          title="Next shot target (j)"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onResetTarget}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-chrome-300 transition hover:border-white/20 hover:text-white"
          title="Reset shot target (s)"
        >
          Start
        </button>
      </div>

      <div className="min-w-0 flex-1 text-sm text-chrome-300">
        <span className="font-medium text-white">
          Shot {guideIndex + 1}/{messageCount}
        </span>{" "}
        {guideMessage ? `· ${guideMessage.authorName}` : ""}
        <span
          className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            captureStartMode === "auto"
              ? "border-discord-accent/40 bg-discord-accent/15 text-discord-accent"
              : "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
          }`}
        >
          {captureStartMode}
        </span>
        <span className="ml-2 text-chrome-400">
          Range {effectiveCaptureStartIndex + 1}-{guideIndex + 1} ({captureCount})
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={capturePrefix}
          onChange={(event) => onChangePrefix(event.target.value)}
          className="h-9 w-24 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none transition focus:border-discord-accent"
          aria-label="Screenshot filename prefix"
        />
        <input
          type="number"
          min="1"
          value={captureCounter}
          onChange={(event) => onChangeCounter(Math.max(1, Number(event.target.value)))}
          className="h-9 w-16 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none transition focus:border-discord-accent"
          aria-label="Next screenshot number"
        />
        <button
          type="button"
          onClick={onMarkStart}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-chrome-300 transition hover:border-white/20 hover:text-white"
          title="Set screenshot range start ([)"
        >
          <Flag className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onResetRange}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-chrome-300 transition hover:border-white/20 hover:text-white"
          title="Auto-group same-author range (])"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCapture}
          disabled={isCapturing}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-discord-accent bg-discord-accent px-3 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          title="Download screenshot (c)"
        >
          <Camera className="h-4 w-4" />
          PNG
        </button>
      </div>

      <div className="text-xs uppercase tracking-[0.2em] text-chrome-500">
        `k/j` nav · `s` start · `[` mark · `]` auto · `c` png
      </div>
      {captureStatus ? <div className="basis-full text-xs text-chrome-400">{captureStatus}</div> : null}
    </div>
  );
}
