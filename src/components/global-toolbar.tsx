"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Upload, X, ZoomIn } from "lucide-react";
import { useAppContext } from "@/state/app-context";

export function GlobalToolbar() {
  const { canvasScale, exportState, importState, importStory, setCanvasScale } =
    useAppContext();
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyScript, setStoryScript] = useState(`@workspace
server: Fake Web Studio
channel: general

@accounts
Lucas | #f2bd62
Ava | #57f287

@messages
Lucas: We need a clean import format for stories.
+2m | Ava: This line happens two minutes later.
SYSTEM: Ava joined the server.
2026-04-04 14:30 | Lucas: This line uses an explicit timestamp.
`);

  return (
    <>
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

        <input
          ref={jsonInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            try {
              const raw = await file.text();
              importState(raw);
            } catch (error) {
              window.alert(
                error instanceof Error
                  ? error.message
                  : "Failed to import JSON.",
              );
            }
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => jsonInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10"
        >
          <Upload className="h-4 w-4" />
          Import JSON
        </button>

        <button
          type="button"
          onClick={() => setStoryModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10"
        >
          <FileText className="h-4 w-4" />
          Import Story
        </button>

        <button
          type="button"
          onClick={() => {
            const blob = new Blob([exportState()], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "fake-web-session.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>

      {storyModalOpen
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-white/10 bg-chrome-950 p-5 shadow-panel">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
                  Import Story
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Paste a story script
                </h3>
                <p className="mt-2 text-sm text-chrome-300">
                  The parser supports workspace settings, optional account
                  declarations, system messages, relative gaps like `+2m`, and
                  explicit timestamps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-chrome-300 transition hover:border-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <label className="block">
                <span className="mb-2 block text-sm text-chrome-300">
                  Story script
                </span>
                <textarea
                  value={storyScript}
                  onChange={(event) => setStoryScript(event.target.value)}
                  rows={18}
                  className="w-full rounded-2xl border border-white/10 bg-chrome-900 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-discord-accent"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-chrome-300">
                <p className="font-medium text-white">Supported format</p>
                <div className="mt-3 space-y-2">
                  <p>`@workspace` section:</p>
                  <p>`server: My Server`</p>
                  <p>`channel: general`</p>
                  <p>`@accounts` section:</p>
                  <p>`Lucas | #f2bd62`</p>
                  <p>`Ava | #57f287`</p>
                  <p>`@messages` section:</p>
                  <p>`Lucas: plain message`</p>
                  <p>`+2m | Ava: relative delay`</p>
                  <p>`SYSTEM: system event text`</p>
                  <p>`2026-04-04 14:30 | Lucas: explicit timestamp`</p>
                  <p>`Today 21:03 | Cassius: natural current-day timestamp`</p>
                  <p>`Yesterday 14:30 | Brutus: natural previous-day timestamp`</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-chrome-300 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    importStory(storyScript);
                    setStoryModalOpen(false);
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to import story.",
                    );
                  }
                }}
                className="inline-flex items-center rounded-xl border border-discord-accent bg-discord-accent px-4 py-2 text-sm text-white transition hover:brightness-110"
              >
                Import story
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
