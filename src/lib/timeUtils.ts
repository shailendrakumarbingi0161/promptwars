export function timeToMins(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minsToTime(mins: number): string {
  if (mins === undefined || mins === null || isNaN(mins)) return '--:--';
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatDelay(mins: number): string {
  if (mins === 0) return 'On Time';
  if (mins > 0) return `+${mins}m`;
  return `${mins}m`;
}
