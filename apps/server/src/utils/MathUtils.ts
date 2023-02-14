export function getEndOfDayTimeStamp(): number {
  const interval = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
  const startOfDay = Math.floor(Date.now() / interval) * interval;
  const endOfDay = startOfDay + interval - 1; // 23:59:59:9999

  return endOfDay;
}
