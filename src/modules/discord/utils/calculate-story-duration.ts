import type {
  DiscordMessage,
  DiscordModuleState,
  DiscordStoryPart,
} from "@/modules/discord/state/discord-types";

export interface StoryDurationEstimate {
  messageCount: number;
  userMessageCount: number;
  withSystem: {
    minSeconds: number;
    maxSeconds: number;
  };
  withoutSystem: {
    minSeconds: number;
    maxSeconds: number;
  };
}

export interface StoryDurationSummary {
  parts: Array<{ part: DiscordStoryPart; estimate: StoryDurationEstimate }>;
  total: StoryDurationEstimate;
}

function estimate(messages: DiscordMessage[]): StoryDurationEstimate {
  const messageCount = messages.length;
  const userMessageCount = messages.filter((message) => message.type !== "system").length;

  return {
    messageCount,
    userMessageCount,
    withSystem: {
      minSeconds: messageCount * 2,
      maxSeconds: messageCount * 5,
    },
    withoutSystem: {
      minSeconds: userMessageCount * 2,
      maxSeconds: userMessageCount * 5,
    },
  };
}

export function calculateStoryDuration(state: DiscordModuleState): StoryDurationSummary {
  const parts = state.parts.map((part) => ({
    part,
    estimate: estimate(part.messages),
  }));

  const totalMessages = state.parts.flatMap((part) => part.messages);

  return {
    parts,
    total: estimate(totalMessages),
  };
}

export function formatDurationRange(minSeconds: number, maxSeconds: number) {
  function formatOne(value: number) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;

    if (!minutes) {
      return `${seconds}s`;
    }

    if (!seconds) {
      return `${minutes}m`;
    }

    return `${minutes}m ${seconds}s`;
  }

  return `${formatOne(minSeconds)}-${formatOne(maxSeconds)}`;
}
