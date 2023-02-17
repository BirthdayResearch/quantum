export function getNextDayTimestamp(): number {
  const duration = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

  return Date.now() + duration;
}
