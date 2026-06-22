export function fmtDue(epochSecs: number): string {
  const diff = epochSecs - Date.now() / 1000;
  if (diff <= 0) return "fällig";
  const mins = Math.round(diff / 60);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `in ${days} Tg.`;
  const months = Math.round(days / 30);
  if (months < 12) return `in ${months} Mon.`;
  return `in ${(days / 365).toFixed(1)} J.`;
}

export function fmtInterval(days: number): string {
  if (days <= 0) return "10 min";
  if (days < 1) return "<1 Tg.";
  if (days < 30) return `${Math.round(days)} Tg.`;
  if (days < 365) return `${Math.round(days / 30)} Mon.`;
  return `${(days / 365).toFixed(1)} J.`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
