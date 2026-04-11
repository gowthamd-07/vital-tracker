import { nowIST } from "./dates";

/**
 * Compute the current streak for a habit.
 * Walk backwards from today (IST); if today is not done, allow yesterday as start.
 */
export function computeStreak(completionDates: Set<string>): number {
  let streak = 0;
  const d = nowIST();
  const todayStr = d.toISOString().slice(0, 10);

  if (!completionDates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }

  while (completionDates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

/** Best (longest) streak ever recorded. */
export function longestStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0;
  const sorted = [...completionDates].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86_400_000,
    );
    if (diffDays === 1) {
      run++;
      if (run > best) best = run;
    } else if (diffDays > 1) {
      run = 1;
    }
  }
  return best;
}
