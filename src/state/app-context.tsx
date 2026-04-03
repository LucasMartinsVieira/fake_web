"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import { AppState, ModuleId } from "@/state/app-types";
import { loadStoredAppState, storeAppState } from "@/state/storage";

interface AppContextValue extends AppState {
  setActiveModule: (moduleId: ModuleId) => void;
  setCanvasScale: (value: number) => void;
}

const initialState: AppState = {
  activeModule: "discord",
  canvasScale: 1,
  discordState: initialDiscordState,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const stored = loadStoredAppState();

    if (!stored) {
      return;
    }

    setState((current) => ({ ...current, ...stored }));
  }, []);

  useEffect(() => {
    storeAppState(state);
  }, [state]);

  const value: AppContextValue = {
    ...state,
    setActiveModule: (activeModule) =>
      setState((current) => ({ ...current, activeModule })),
    setCanvasScale: (canvasScale) =>
      setState((current) => ({ ...current, canvasScale })),
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
