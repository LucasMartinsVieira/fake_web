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
    expectedSeconds: number;
    maxSeconds: number;
  };
  withoutSystem: {
    minSeconds: number;
    expectedSeconds: number;
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
      minSeconds: messageCount,
      expectedSeconds: messageCount * 3,
      maxSeconds: messageCount * 5,
    },
    withoutSystem: {
      minSeconds: userMessageCount,
      expectedSeconds: userMessageCount * 3,
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

function formatSeconds(value: number) {
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

export function formatDurationRange(minSeconds: number, maxSeconds: number) {
  return `${formatSeconds(minSeconds)}-${formatSeconds(maxSeconds)}`;
}

export function formatDurationEstimate(
  minSeconds: number,
  expectedSeconds: number,
  maxSeconds: number,
) {
  return `${formatSeconds(minSeconds)} / ${formatSeconds(expectedSeconds)} / ${formatSeconds(maxSeconds)}`;
}
