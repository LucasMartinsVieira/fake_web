"use client";

import { DiscordEditorPanel } from "@/modules/discord/components/editor-panel";
import { DiscordPreview } from "@/modules/discord/components/preview";

export function DiscordWorkspace() {
  return (
    <>
      <DiscordEditorPanel />
      <DiscordPreview />
    </>
  );
}
