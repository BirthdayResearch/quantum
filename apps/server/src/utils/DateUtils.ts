export function getNextDayTimestamp(): number {
  const duration = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
  const currentTimestamp = Math.floor(Date.now());
  const nextDayTimestamp = currentTimestamp + duration;

  return nextDayTimestamp;
}
