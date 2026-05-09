"use client";

import { toPng } from "html-to-image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useAppContext } from "@/state/app-context";
import type { DiscordMessage } from "@/modules/discord/state/discord-types";
import { CaptureToolbar } from "@/modules/discord/components/preview/capture-toolbar";
import { ChatInputPreview } from "@/modules/discord/components/preview/chat-input-preview";
import { DiscordMessageList } from "@/modules/discord/components/preview/message-list";
import { MemberList } from "@/modules/discord/components/preview/member-list";
import {
  EditMessageModal,
  ResetShotModal,
} from "@/modules/discord/components/preview/modals";
import {
  applyMention,
  discordThemes,
  downloadDataUrl,
  fromDateTimeLocalValue,
  getCaptureRunStartIndex,
  getMentionQuery,
  inlineClonedImages,
  isTypingTarget,
  nextFrame,
  sanitizeFilePart,
  toDateTimeLocalValue,
} from "@/modules/discord/components/preview/utils";

export function DiscordPreview() {
  const { assetUrls, canvasScale, discordState, discordActions } = useAppContext();
  const zoomStyle = { zoom: canvasScale } as CSSProperties;
  const theme = discordThemes[discordState.theme];
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<"chat" | "members" | "input">("chat");
  const [editingType, setEditingType] = useState<"user" | "system">("user");
  const [editingAuthorId, setEditingAuthorId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingManualTimestamp, setEditingManualTimestamp] = useState(false);
  const [editingTimestamp, setEditingTimestamp] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );
  const [chatInputValue, setChatInputValue] = useState("");
  const [guideIndex, setGuideIndex] = useState(0);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [captureStartIndex, setCaptureStartIndex] = useState<number | null>(null);
  const [capturePrefix, setCapturePrefix] = useState("hook");
  const [captureCounter, setCaptureCounter] = useState(1);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);
  const messageRefs = useRef<Record<string, HTMLElement | null>>({});
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const editingMessage =
    discordState.messages.find((message) => message.id === editingMessageId) ?? null;
  const editingMentionQuery = getMentionQuery(editingContent);
  const editingMentionSuggestions =
    editingMentionQuery === null
      ? []
      : discordState.accounts.filter((account) =>
          account.username.toLowerCase().startsWith(editingMentionQuery),
        );
  const inputTargetAccount =
    discordState.accounts.find(
      (account) => account.id === discordState.inputTargetAccountId,
    ) ?? null;
  const typingAccount =
    discordState.accounts.find((account) => account.id === discordState.typingAccountId) ??
    null;
  const guideMessage = discordState.messages[guideIndex] ?? null;
  const effectiveCaptureStartIndex =
    captureStartIndex === null
      ? getCaptureRunStartIndex(discordState.messages, guideIndex)
      : Math.min(captureStartIndex, guideIndex);
  const captureStartMessage = discordState.messages[effectiveCaptureStartIndex] ?? null;
  const captureCount = guideIndex - effectiveCaptureStartIndex + 1;

  useEffect(() => {
    if (!editingMessage) {
      return;
    }

    setEditingType(editingMessage.type);
    setEditingAuthorId(editingMessage.authorId ?? "");
    setEditingContent(editingMessage.content);
    setEditingManualTimestamp(editingMessage.manualTimestamp);
    setEditingTimestamp(toDateTimeLocalValue(editingMessage.timestamp));
  }, [editingMessage]);

  useEffect(() => {
    setGuideIndex((current) =>
      Math.min(current, Math.max(discordState.messages.length - 1, 0)),
    );
  }, [discordState.messages.length]);

  useEffect(() => {
    setCaptureStartIndex((current) => {
      if (current === null || !discordState.messages.length) {
        return discordState.messages.length ? current : null;
      }

      return Math.min(current, discordState.messages.length - 1);
    });
  }, [discordState.messages.length]);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    },
    [],
  );

  const focusGuideMessage = useCallback(
    (nextIndex: number) => {
      const nextMessage = discordState.messages[nextIndex];

      if (!nextMessage) {
        return;
      }

      setGuideIndex(nextIndex);
      setFlashMessageId(nextMessage.id);

      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = window.setTimeout(() => {
        setFlashMessageId((current) => (current === nextMessage.id ? null : current));
      }, 300);

      window.requestAnimationFrame(() => {
        messageRefs.current[nextMessage.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    },
    [discordState.messages],
  );

  const stepGuide = useCallback(
    (direction: "prev" | "next") => {
      const delta = direction === "next" ? 1 : -1;
      const nextIndex = Math.max(
        0,
        Math.min(discordState.messages.length - 1, guideIndex + delta),
      );

      focusGuideMessage(nextIndex);
    },
    [discordState.messages.length, focusGuideMessage, guideIndex],
  );

  const captureMessageRange = useCallback(
    async ({
      startIndex,
      endIndex,
      filename,
    }: {
      startIndex: number;
      endIndex: number;
      filename: string;
    }) => {
      const list = messageListRef.current;

      if (!list) {
        throw new Error("Message list missing");
      }

      const nodes = Array.from(
        list.querySelectorAll<HTMLElement>("[data-message-index]"),
      ).filter((node) => {
        const index = Number(node.dataset.messageIndex);
        return index >= startIndex && index <= endIndex;
      });

      if (!nodes.length) {
        throw new Error("No messages in capture range");
      }

      let wrapper: HTMLDivElement | null = null;

      try {
        await nextFrame();

        const captureWrapper = document.createElement("div");
        const logicalWidth = list.scrollWidth;
        wrapper = captureWrapper;
        captureWrapper.className = "discord-capture-export";
        captureWrapper.style.position = "fixed";
        captureWrapper.style.left = "0";
        captureWrapper.style.top = "0";
        captureWrapper.style.width = `${logicalWidth}px`;
        captureWrapper.style.padding = "0 8px 0 0";
        captureWrapper.style.background = theme.background;
        captureWrapper.style.color = theme.text;
        captureWrapper.style.pointerEvents = "none";
        captureWrapper.style.zIndex = "-1";
        captureWrapper.style.fontFamily = '"gg sans", ui-sans-serif, system-ui, sans-serif';

        nodes.forEach((node) => {
          captureWrapper.appendChild(node.cloneNode(true));
        });

        document.body.appendChild(captureWrapper);
        await inlineClonedImages(captureWrapper);
        captureWrapper.style.zoom = String(canvasScale);
        await nextFrame();

        const renderedBounds = captureWrapper.getBoundingClientRect();
        const renderedWidth = Math.ceil(renderedBounds.width);
        const renderedHeight = Math.ceil(renderedBounds.height);

        const dataUrl = await toPng(captureWrapper, {
          cacheBust: true,
          pixelRatio: 3,
          backgroundColor: theme.background,
          width: renderedWidth,
          height: renderedHeight,
          style: {
            transform: "none",
          },
        });

        downloadDataUrl(dataUrl, filename);
      } finally {
        wrapper?.remove();
      }
    },
    [canvasScale, theme.background, theme.text],
  );

  const captureGuideRange = useCallback(async () => {
    const list = messageListRef.current;
    const prefix = sanitizeFilePart(capturePrefix) || "hook";
    const startIndex = effectiveCaptureStartIndex;
    const endIndex = guideIndex;

    if (!list || !discordState.messages.length || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setCaptureStatus("Rendering...");

    try {
      const ranges = Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => ({
        startIndex,
        endIndex: startIndex + offset,
      }));
      const shouldBurst = captureStartIndex === null && ranges.length > 1;
      const captureRanges = shouldBurst ? ranges : [{ startIndex, endIndex }];

      for (const [offset, range] of captureRanges.entries()) {
        const fileNumber = captureCounter + offset;
        await captureMessageRange({
          startIndex: range.startIndex,
          endIndex: range.endIndex,
          filename: `${prefix}_${fileNumber}.png`,
        });
      }

      setCaptureCounter((current) => current + captureRanges.length);
      setCaptureStatus(
        shouldBurst
          ? `Saved ${captureRanges.length} shots from ${prefix}_${captureCounter}.png`
          : `Saved ${prefix}_${captureCounter}.png (${captureCount} msg)`,
      );
    } catch (error) {
      setCaptureStatus(error instanceof Error ? error.message : "Screenshot failed");
    } finally {
      setIsCapturing(false);
    }
  }, [
    captureMessageRange,
    captureCount,
    captureCounter,
    capturePrefix,
    captureStartIndex,
    discordState.messages.length,
    effectiveCaptureStartIndex,
    guideIndex,
    isCapturing,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (previewView !== "chat" || editingMessageId || isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "j") {
        event.preventDefault();
        stepGuide("next");
      }

      if (event.key === "k") {
        event.preventDefault();
        stepGuide("prev");
      }

      if (event.key === "s") {
        event.preventDefault();
        setResetModalOpen(true);
      }

      if (event.key === "c") {
        event.preventDefault();
        void captureGuideRange();
      }

      if (event.key === "[") {
        event.preventDefault();
        setCaptureStartIndex(guideIndex);
        setCaptureStatus(`Range starts at shot ${guideIndex + 1}`);
      }

      if (event.key === "]") {
        event.preventDefault();
        setCaptureStartIndex(null);
        setCaptureStatus("Range auto-groups same author");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [captureGuideRange, editingMessageId, guideIndex, previewView, stepGuide]);

  useEffect(() => {
    if (!resetModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setResetModalOpen(false);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        focusGuideMessage(0);
        setCaptureStartIndex(null);
        setResetModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusGuideMessage, resetModalOpen]);

  function openMessageEditor(message: DiscordMessage) {
    setEditingMessageId(message.id);
  }

  function resetCaptureRangeToAuto() {
    setCaptureStartIndex(null);
    setCaptureStatus("Range auto-groups same author");
  }

  function markCaptureRangeStart() {
    setCaptureStartIndex(guideIndex);
    setCaptureStatus(`Range starts at shot ${guideIndex + 1}`);
  }

  function confirmResetShotTarget() {
    focusGuideMessage(0);
    setCaptureStartIndex(null);
    setResetModalOpen(false);
  }

  function saveEditingMessage() {
    if (!editingMessage) {
      return;
    }

    discordActions.updateMessage(editingMessage.id, {
      type: editingType,
      authorId: editingType === "system" ? null : editingAuthorId,
      content: editingContent,
      manualTimestamp: editingManualTimestamp,
      timestamp: editingManualTimestamp ? fromDateTimeLocalValue(editingTimestamp) : undefined,
    });
    setEditingMessageId(null);
  }

  function deleteEditingMessage() {
    if (!editingMessage) {
      return;
    }

    discordActions.removeMessage(editingMessage.id);
    setEditingMessageId(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-chrome-950/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">Preview</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Discord Web mockup</h2>
          </div>

          <div className="flex rounded-xl bg-chrome-900/50 p-1">
            <button
              onClick={() => setPreviewView("chat")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                previewView === "chat"
                  ? "bg-discord-accent text-white shadow-sm"
                  : "text-chrome-300 hover:text-white"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setPreviewView("members")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                previewView === "members"
                  ? "bg-discord-accent text-white shadow-sm"
                  : "text-chrome-300 hover:text-white"
              }`}
            >
              Member List
            </button>
            <button
              onClick={() => setPreviewView("input")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                previewView === "input"
                  ? "bg-discord-accent text-white shadow-sm"
                  : "text-chrome-300 hover:text-white"
              }`}
            >
              Chat Input
            </button>
          </div>

          <p className="text-sm text-chrome-300">
            {discordState.channelName} · {discordState.serverName}
          </p>
        </div>

        {previewView === "chat" && discordState.messages.length > 0 ? (
          <CaptureToolbar
            captureCount={captureCount}
            captureCounter={captureCounter}
            capturePrefix={capturePrefix}
            captureStatus={captureStatus}
            captureStartMode={captureStartIndex === null ? "auto" : "mark"}
            guideIndex={guideIndex}
            guideMessage={guideMessage}
            isCapturing={isCapturing}
            messageCount={discordState.messages.length}
            onCapture={() => {
              void captureGuideRange();
            }}
            onChangeCounter={setCaptureCounter}
            onChangePrefix={setCapturePrefix}
            onMarkStart={markCaptureRangeStart}
            onResetRange={resetCaptureRangeToAuto}
            onResetTarget={() => setResetModalOpen(true)}
            onStepNext={() => stepGuide("next")}
            onStepPrev={() => stepGuide("prev")}
            effectiveCaptureStartIndex={effectiveCaptureStartIndex}
          />
        ) : null}

        <div className="overflow-auto rounded-[20px] bg-discord-panel p-6">
          <div className="mx-auto transition-[zoom]" style={zoomStyle}>
            <div
              className="w-[880px] max-w-full overflow-hidden rounded-[16px]"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
              }}
            >
              {previewView === "chat" ? (
                <div className="flex min-h-[760px] flex-col">
                  <div className="border-b border-white/5 px-6 pb-4 pt-6">
                    <p className="text-lg font-semibold">#{discordState.channelName}</p>
                    <p className="text-sm text-discord-muted">
                      Mock conversation preview scaffold
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pt-6">
                    <DiscordMessageList
                      accounts={discordState.accounts}
                      assetUrls={assetUrls}
                      mentionColor={theme.mention}
                      messages={discordState.messages}
                      captureStartMessageId={captureStartMessage?.id ?? null}
                      captureStartMode={captureStartIndex === null ? "auto" : "mark"}
                      guideMessageId={guideMessage?.id ?? null}
                      flashMessageId={flashMessageId}
                      messageRefs={messageRefs}
                      messageListRef={messageListRef}
                      onEditMessage={openMessageEditor}
                      onMoveMessage={discordActions.moveMessage}
                    />
                  </div>
                </div>
              ) : previewView === "input" ? (
                <div className="min-h-[360px] p-6">
                  <ChatInputPreview
                    channelName={discordState.channelName}
                    inputTargetUsername={inputTargetAccount?.username ?? null}
                    typingUsername={typingAccount?.username ?? null}
                    value={chatInputValue}
                    onChange={setChatInputValue}
                  />
                </div>
              ) : (
                <div className="flex-1 p-6">
                  <MemberList
                    accounts={discordState.accounts}
                    assetUrls={assetUrls}
                    statusBg={theme.background}
                    isFullWidth
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditMessageModal
        accounts={discordState.accounts}
        editingAuthorId={editingAuthorId}
        editingContent={editingContent}
        editingManualTimestamp={editingManualTimestamp}
        editingMentionSuggestions={editingMentionSuggestions}
        editingMessage={editingMessage}
        editingTimestamp={editingTimestamp}
        editingType={editingType}
        onApplyMention={(username) => setEditingContent((current) => applyMention(current, username))}
        onChangeAuthorId={setEditingAuthorId}
        onChangeContent={setEditingContent}
        onChangeManualTimestamp={setEditingManualTimestamp}
        onChangeTimestamp={setEditingTimestamp}
        onChangeType={setEditingType}
        onClose={() => setEditingMessageId(null)}
        onDelete={deleteEditingMessage}
        onSave={saveEditingMessage}
      />

      <ResetShotModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmResetShotTarget}
      />
    </>
  );
}
