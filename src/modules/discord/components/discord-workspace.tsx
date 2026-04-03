"use client";

import { useAppContext } from "@/state/app-context";
import { DiscordEditorPanel } from "@/modules/discord/components/editor-panel";
import { DiscordPreview } from "@/modules/discord/components/preview";

export function DiscordWorkspace() {
  const { screenshotMode } = useAppContext();

  return (
    <>
      {!screenshotMode ? <DiscordEditorPanel /> : null}
      <DiscordPreview />
    </>
  );
}
