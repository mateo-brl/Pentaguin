/** Jour précédent d'une clé YYYY-MM-DD (arithmétique en UTC, insensible au DST). */
export function previousDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export type Streak = { current: number; longest: number };

/**
 * Streak à partir des jours d'activité (clés locales YYYY-MM-DD).
 * `current` : chaîne de jours consécutifs se terminant aujourd'hui — ou hier
 * (série encore sauvable dans la journée). `longest` : meilleure chaîne historique.
 */
export function computeStreak(dates: readonly string[], today: string): Streak {
  const days = new Set(dates);

  let cursor = days.has(today) ? today : previousDay(today);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    run = previous !== null && previousDay(date) === previous ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  return { current, longest: Math.max(longest, current) };
}
