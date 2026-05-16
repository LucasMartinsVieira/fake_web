"use client";

import { TwitterEditorPanel } from "@/modules/twitter/components/editor-panel";
import { TwitterPreview } from "@/modules/twitter/components/preview";

export function TwitterWorkspace() {
  return (
    <>
      <TwitterEditorPanel />
      <TwitterPreview />
    </>
  );
}
