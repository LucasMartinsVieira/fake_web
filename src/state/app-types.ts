import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import { DiscordModuleState } from "@/modules/discord/state/discord-types";

export type ModuleId = "discord" | "twitter" | "instagram";

export interface ModuleOption {
  id: ModuleId;
  label: string;
  enabled: boolean;
}

export interface GlobalUiState {
  activeModule: ModuleId;
  canvasScale: number;
}

export interface AppState extends GlobalUiState {
  discordState: DiscordModuleState;
}

export const initialStateSnapshot: AppState = {
  activeModule: "discord",
  canvasScale: 1.6,
  discordState: initialDiscordState,
};

export const moduleOptions: ModuleOption[] = [
  { id: "discord", label: "Discord", enabled: true },
  { id: "twitter", label: "X / Twitter", enabled: false },
  { id: "instagram", label: "Instagram", enabled: false },
];
