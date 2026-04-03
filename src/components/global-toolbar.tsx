"use client";

import { Download, Upload, ZoomIn } from "lucide-react";
import { useAppContext } from "@/state/app-context";

export function GlobalToolbar() {
  const { canvasScale, setCanvasScale } = useAppContext();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300">
        <ZoomIn className="h-4 w-4" />
        <span>{Math.round(canvasScale * 100)}%</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={canvasScale}
          onChange={(event) => setCanvasScale(Number(event.target.value))}
          className="accent-discord-accent"
        />
      </label>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10"
      >
        <Upload className="h-4 w-4" />
        Import JSON
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10"
      >
        <Download className="h-4 w-4" />
        Export JSON
      </button>
    </div>
  );
}
