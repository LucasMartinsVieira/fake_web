"use client";

import {
  startTransition,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import {
  createDiscordAccount,
  createDiscordMessage,
  getActiveStoryPart,
  moveDiscordMessage,
  normalizeDiscordState,
  patchDiscordWorkspace,
  removeDiscordAccount,
  removeDiscordMessage,
  updateDiscordAccount,
  updateDiscordMessage,
} from "@/modules/discord/state/discord-state";
import type {
  DiscordAccountDraft,
  DiscordMessageDraft,
  DiscordMessagePatch,
  DiscordStoryPart,
  DiscordStoryPartPatch,
} from "@/modules/discord/state/discord-types";
import {
  initialStateSnapshot,
  type AppState,
  type ModuleId,
} from "@/state/app-types";
import { parseStoryScript } from "@/modules/discord/utils/parse-story-script";
import {
  parseImportedAppState,
  serializeAppState,
} from "@/state/import-export";
import { loadStoredAppState, storeAppState } from "@/state/storage";
import {
  loadAssetBlob,
  saveAssetDataUrl,
  syncStoredAssets,
} from "@/state/asset-storage";

interface DiscordActionSet {
  updateWorkspace: (patch: DiscordStoryPartPatch) => void;
  createAccount: (draft: DiscordAccountDraft) => void;
  updateAccount: (
    accountId: string,
    patch: Partial<DiscordAccountDraft>,
  ) => void;
  removeAccount: (accountId: string) => void;
  createMessage: (draft: DiscordMessageDraft) => void;
  updateMessage: (messageId: string, patch: DiscordMessagePatch) => void;
  removeMessage: (messageId: string) => void;
  moveMessage: (messageId: string, direction: "up" | "down") => void;
}

interface AppContextValue extends AppState {
  assetUrls: Record<string, string>;
  activeStoryPart: DiscordStoryPart;
  setActiveModule: (moduleId: ModuleId) => void;
  setActiveStoryPart: (partId: string) => void;
  setCanvasScale: (value: number) => void;
  exportState: () => string;
  importState: (raw: string) => void;
  importStory: (raw: string) => void;
  discordActions: DiscordActionSet;
}

const initialState: AppState = initialStateSnapshot;

const AppContext = createContext<AppContextValue | null>(null);

function collectReferencedAssetIds(state: AppState) {
  return Array.from(
    new Set([
      ...state.discordState.accounts
        .map((account) => account.avatarAssetId)
        .filter((assetId): assetId is string => Boolean(assetId)),
      ...state.discordState.parts.flatMap((part) =>
        part.messages.flatMap((message) =>
          message.attachments
            .map((attachment) => attachment.assetId)
            .filter((assetId): assetId is string => Boolean(assetId)),
        ),
      ),
    ]),
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const stored = loadStoredAppState();

    if (!stored) {
      return initialState;
    }

    return {
      ...initialState,
      ...stored,
      discordState: normalizeDiscordState(
        stored.discordState ?? initialDiscordState,
      ),
    };
  });

  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const assetUrlsRef = useRef<Record<string, string>>({});
  const referencedAssetIds = useMemo(
    () => collectReferencedAssetIds(state),
    [state],
  );
  const activeStoryPart = useMemo(
    () => getActiveStoryPart(state.discordState),
    [state.discordState],
  );

  useEffect(() => {
    const persist = () => {
      storeAppState(state);
    };
    let idleId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(persist, { timeout: 1000 });
        return;
      }

      persist();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    async function migrateLegacyAssets() {
      const nextAccounts = await Promise.all(
        state.discordState.accounts.map(async (account) => {
          const legacyAvatarBase64 = (
            account as typeof account & { avatarBase64?: string | null }
          ).avatarBase64;

          if (!legacyAvatarBase64) {
            return {
              id: account.id,
              username: account.username,
              avatarAssetId: account.avatarAssetId,
              roleColor: account.roleColor,
              status: account.status,
            };
          }

          return {
            id: account.id,
            username: account.username,
            avatarAssetId: account.avatarAssetId
              ? account.avatarAssetId
              : await saveAssetDataUrl(legacyAvatarBase64),
            roleColor: account.roleColor,
            status: account.status,
          };
        }),
      );

      const nextParts = await Promise.all(
        state.discordState.parts.map(async (part) => ({
          ...part,
          messages: await Promise.all(
            part.messages.map(async (message) => ({
              ...message,
              attachments: await Promise.all(
                message.attachments.map(async (attachment) => {
                  const legacyBase64 = (
                    attachment as typeof attachment & { base64?: string }
                  ).base64;

                  if (!legacyBase64 || attachment.assetId) {
                    return attachment;
                  }

                  return {
                    id: attachment.id,
                    type: attachment.type,
                    name: attachment.name,
                    assetId: await saveAssetDataUrl(legacyBase64),
                  };
                }),
              ),
            })),
          ),
        })),
      );

      const hasAccountChanges = nextAccounts.some(
        (account, index) =>
          account.avatarAssetId !== state.discordState.accounts[index]?.avatarAssetId,
      ) || state.discordState.accounts.some((account) => {
        const legacyAvatarBase64 = (
          account as typeof account & { avatarBase64?: string | null }
        ).avatarBase64;

        return Boolean(legacyAvatarBase64);
      });
      const hasAttachmentChanges = nextParts.some((part, partIndex) =>
        part.messages.some((message, messageIndex) =>
          message.attachments.some(
            (attachment, attachmentIndex) =>
              attachment.assetId !==
              state.discordState.parts[partIndex]?.messages[messageIndex]?.attachments[
                attachmentIndex
              ]?.assetId,
          ),
        ),
      ) || state.discordState.parts.some((part) =>
        part.messages.some((message) =>
          message.attachments.some((attachment) => Boolean(attachment.base64)),
        ),
      );

      if (cancelled || (!hasAccountChanges && !hasAttachmentChanges)) {
        return;
      }

      setState((current) => ({
        ...current,
        discordState: normalizeDiscordState({
          ...current.discordState,
          accounts: nextAccounts,
          parts: nextParts,
        }),
      }));
    }

    void migrateLegacyAssets();

    return () => {
      cancelled = true;
    };
  }, [state.discordState.accounts, state.discordState.parts]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAssetUrls() {
      const entries = await Promise.all(
        referencedAssetIds.map(async (assetId) => {
          const blob = await loadAssetBlob(assetId);
          return blob ? ([assetId, URL.createObjectURL(blob)] as const) : null;
        }),
      );

      if (cancelled) {
        entries.forEach((entry) => {
          if (entry) {
            URL.revokeObjectURL(entry[1]);
          }
        });
        return;
      }

      const nextAssetUrls = Object.fromEntries(
        entries.filter((entry): entry is readonly [string, string] => entry !== null),
      );
      const previousAssetUrls = assetUrlsRef.current;

      Object.entries(previousAssetUrls).forEach(([assetId, url]) => {
        if (nextAssetUrls[assetId] !== url) {
          URL.revokeObjectURL(url);
        }
      });

      assetUrlsRef.current = nextAssetUrls;
      setAssetUrls(nextAssetUrls);
    }

    void hydrateAssetUrls();
    void syncStoredAssets(referencedAssetIds);

    return () => {
      cancelled = true;
    };
  }, [referencedAssetIds]);

  useEffect(
    () => () => {
      Object.values(assetUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const value: AppContextValue = {
    ...state,
    assetUrls,
    activeStoryPart,
    setActiveModule: (activeModule) =>
      setState((current) => ({ ...current, activeModule })),
    setActiveStoryPart: (partId) =>
      setState((current) => ({
        ...current,
        discordState: {
          ...current.discordState,
          activeStoryPartId: partId,
        },
      })),
    setCanvasScale: (canvasScale) =>
      setState((current) => ({ ...current, canvasScale })),
    exportState: () => serializeAppState(state),
    importState: (raw) => {
      const imported = parseImportedAppState(raw);
      startTransition(() => {
        setState({
          ...initialState,
          ...imported,
          discordState: normalizeDiscordState(imported.discordState),
        });
      });
    },
    importStory: (raw) => {
      const discordState = normalizeDiscordState(parseStoryScript(raw));
      startTransition(() => {
        setState((current) => ({
          ...current,
          activeModule: "discord",
          discordState,
        }));
      });
    },
    discordActions: {
      updateWorkspace: (patch) =>
        setState((current) => ({
          ...current,
          discordState: patchDiscordWorkspace(
            current.discordState,
            patch,
            current.discordState.activeStoryPartId ?? undefined,
          ),
        })),
      createAccount: (draft) =>
        setState((current) => ({
          ...current,
          discordState: createDiscordAccount(current.discordState, draft),
        })),
      updateAccount: (accountId, patch) =>
        setState((current) => ({
          ...current,
          discordState: updateDiscordAccount(
            current.discordState,
            accountId,
            patch,
          ),
        })),
      removeAccount: (accountId) =>
        setState((current) => ({
          ...current,
          discordState: removeDiscordAccount(current.discordState, accountId),
        })),
      createMessage: (draft) =>
        setState((current) => ({
          ...current,
          discordState: createDiscordMessage(
            current.discordState,
            draft,
            current.discordState.activeStoryPartId ?? undefined,
          ),
        })),
      updateMessage: (messageId, patch) =>
        setState((current) => ({
          ...current,
          discordState: updateDiscordMessage(
            current.discordState,
            messageId,
            patch,
            current.discordState.activeStoryPartId ?? undefined,
          ),
        })),
      removeMessage: (messageId) =>
        setState((current) => ({
          ...current,
          discordState: removeDiscordMessage(
            current.discordState,
            messageId,
            current.discordState.activeStoryPartId ?? undefined,
          ),
        })),
      moveMessage: (messageId, direction) =>
        setState((current) => ({
          ...current,
          discordState: moveDiscordMessage(
            current.discordState,
            messageId,
            direction,
            current.discordState.activeStoryPartId ?? undefined,
          ),
        })),
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}
