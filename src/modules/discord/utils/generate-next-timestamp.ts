export function generateNextTimestamp(
  previousTimestamp: string,
  gapMinutes = 3,
) {
  const next = new Date(previousTimestamp);
  next.setMinutes(next.getMinutes() + gapMinutes);
  return next.toISOString();
}
