const GYM_KEYWORDS =
  /\b(gym|workout|exercise|training|weights|lifting|crossfit|hiit|cardio|running|cycling|swimming|yoga|pilates|zumba|badminton|tennis|football|cricket practice)\b/i;

/**
 * Finds the first habit whose name matches common exercise keywords.
 * Returns the habit object or undefined.
 */
export function findGymHabit<T extends { name: string }>(
  habits: T[],
): T | undefined {
  return habits.find((h) => GYM_KEYWORDS.test(h.name));
}
