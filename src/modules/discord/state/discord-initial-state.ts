import { DiscordModuleState } from "@/modules/discord/state/discord-types";

export const initialDiscordState: DiscordModuleState = {
  serverName: "Fake Web Studio",
  channelName: "general",
  theme: "ash",
  accounts: [
    {
      id: "account-1",
      username: "Lucas",
      avatarAssetId: null,
      roleColor: "#f2bd62",
      status: "online",
    },
    {
      id: "account-2",
      username: "Ava",
      avatarAssetId: null,
      roleColor: "#57f287",
      status: "online",
    },
  ],
  messages: [
    {
      id: "message-1",
      type: "user",
      authorId: "account-1",
      authorName: "Lucas",
      roleColor: "#f2bd62",
      content: "The Discord workspace scaffold is in place.",
      timestamp: "2026-04-03T15:00:00.000Z",
      manualTimestamp: false,
      attachments: [],
    },
    {
      id: "message-2",
      type: "user",
      authorId: "account-1",
      authorName: "Lucas",
      roleColor: "#f2bd62",
      content: "Next step is wiring the real editor and persistence.",
      timestamp: "2026-04-03T15:03:00.000Z",
      manualTimestamp: false,
      attachments: [],
    },
    {
      id: "message-3",
      type: "user",
      authorId: "account-2",
      authorName: "Ava",
      roleColor: "#57f287",
      content: "The module boundaries are already separated.",
      timestamp: "2026-04-03T15:07:00.000Z",
      manualTimestamp: false,
      attachments: [],
    },
  ],
};
