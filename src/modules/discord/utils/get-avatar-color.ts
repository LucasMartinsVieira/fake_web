const DISCORD_AVATAR_COLORS = [
  "#5865f2", // Blurple
  "#57f287", // Green
  "#fee75c", // Yellow
  "#eb459e", // Fuchsia
  "#ed4245", // Red
];

/**
 * Deterministically returns a Discord avatar color based on a string (name or id).
 */
export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % DISCORD_AVATAR_COLORS.length;
  return DISCORD_AVATAR_COLORS[index];
}
