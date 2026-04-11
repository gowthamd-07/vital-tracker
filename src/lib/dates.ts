const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Current moment shifted to IST — use .toISOString().slice(0,10) for IST date */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/** Today's date string (YYYY-MM-DD) in IST */
export function todayIST(): string {
  return nowIST().toISOString().slice(0, 10);
}

/** Last `count` calendar days ending today (IST), oldest first. */
export function recentDays(count: number): string[] {
  const out: string[] = [];
  const base = nowIST();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function shortDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

/** Days between two YYYY-MM-DD strings (positive if b is later) */
export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round((msB - msA) / 86_400_000);
}
