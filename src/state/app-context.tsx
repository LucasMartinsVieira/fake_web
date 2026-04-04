"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import {
  createDiscordAccount,
  createDiscordMessage,
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
  DiscordWorkspacePatch,
} from "@/modules/discord/state/discord-types";
import { initialStateSnapshot, type AppState, type ModuleId } from "@/state/app-types";
import { parseStoryScript } from "@/modules/discord/utils/parse-story-script";
import { parseImportedAppState, serializeAppState } from "@/state/import-export";
import { loadStoredAppState, storeAppState } from "@/state/storage";

interface DiscordActionSet {
  updateWorkspace: (patch: DiscordWorkspacePatch) => void;
  addAccount: (draft: DiscordAccountDraft) => void;
  updateAccount: (
    accountId: string,
    patch: Partial<DiscordAccountDraft>,
  ) => void;
  removeAccount: (accountId: string) => void;
  addMessage: (draft: DiscordMessageDraft) => void;
  updateMessage: (messageId: string, patch: DiscordMessagePatch) => void;
  removeMessage: (messageId: string) => void;
  moveMessage: (messageId: string, direction: "up" | "down") => void;
}

interface AppContextValue extends AppState {
  setActiveModule: (moduleId: ModuleId) => void;
  setCanvasScale: (value: number) => void;
  exportState: () => string;
  importState: (raw: string) => void;
  importStory: (raw: string) => void;
  discordActions: DiscordActionSet;
}

const initialState: AppState = initialStateSnapshot;

const AppContext = createContext<AppContextValue | null>(null);

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

  useEffect(() => {
    storeAppState(state);
  }, [state]);

  const value: AppContextValue = {
    ...state,
    setActiveModule: (activeModule) =>
      setState((current) => ({ ...current, activeModule })),
    setCanvasScale: (canvasScale) =>
      setState((current) => ({ ...current, canvasScale })),
    exportState: () => serializeAppState(state),
    importState: (raw) => {
      const imported = parseImportedAppState(raw);
      setState({
        ...initialState,
        ...imported,
        discordState: normalizeDiscordState(imported.discordState),
      });
    },
    importStory: (raw) => {
      const discordState = normalizeDiscordState(parseStoryScript(raw));
      setState((current) => ({
        ...current,
        activeModule: "discord",
        discordState,
      }));
    },
    discordActions: {
      updateWorkspace: (patch) =>
        setState((current) => ({
          ...current,
          discordState: patchDiscordWorkspace(current.discordState, patch),
        })),
      addAccount: (draft) =>
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
      addMessage: (draft) =>
        setState((current) => ({
          ...current,
          discordState: createDiscordMessage(current.discordState, draft),
        })),
      updateMessage: (messageId, patch) =>
        setState((current) => ({
          ...current,
          discordState: updateDiscordMessage(
            current.discordState,
            messageId,
            patch,
          ),
        })),
      removeMessage: (messageId) =>
        setState((current) => ({
          ...current,
          discordState: removeDiscordMessage(current.discordState, messageId),
        })),
      moveMessage: (messageId, direction) =>
        setState((current) => ({
          ...current,
          discordState: moveDiscordMessage(
            current.discordState,
            messageId,
            direction,
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
