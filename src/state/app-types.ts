import { initialDiscordState } from "@/modules/discord/state/discord-initial-state";
import { DiscordModuleState } from "@/modules/discord/state/discord-types";
import { initialTwitterState } from "@/modules/twitter/state/twitter-initial-state";
import { TwitterModuleState } from "@/modules/twitter/state/twitter-types";

export type ModuleId = "discord" | "twitter" | "instagram";

export interface ModuleOption {
  id: ModuleId;
  label: string;
  enabled: boolean;
}

export interface GlobalUiState {
  activeModule: ModuleId;
  moduleZooms: Record<ModuleId, number>;
}

export interface AppState extends GlobalUiState {
  discordState: DiscordModuleState;
  twitterState: TwitterModuleState;
}

export const initialStateSnapshot: AppState = {
  activeModule: "discord",
  moduleZooms: {
    discord: 1.6,
    twitter: 1.6,
    instagram: 1.6,
  },
  discordState: initialDiscordState,
  twitterState: initialTwitterState,
};

export const moduleOptions: ModuleOption[] = [
  { id: "discord", label: "Discord", enabled: true },
  { id: "twitter", label: "X / Twitter", enabled: true },
  { id: "instagram", label: "Instagram", enabled: false },
];
