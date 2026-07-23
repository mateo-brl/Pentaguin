import { computeStreak, previousDay, type Streak } from './streak';

/**
 * Cœur de rétention (logique PURE, testable, sans dépendance native).
 *
 * Trois mécaniques qui se renforcent :
 * - Objectif du jour : une petite cible d'XP → le rendez-vous quotidien.
 * - Bouclier de série (freeze) : gagné en atteignant l'objectif, consommé
 *   automatiquement si un jour est raté → une absence isolée ne remet plus la
 *   série à zéro (première cause d'abandon des apps « série »).
 * - Paliers : jalons célébrés pour donner un cap.
 */

/** Cible d'XP quotidienne (2 leçons ou ~3 bonnes réponses). */
export const DAILY_GOAL_XP = 30;
/** Nombre maximum de boucliers stockables. */
export const MAX_FREEZES = 2;
/** Jalons de série célébrés (une fois chacun). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;

export type GoalProgress = { current: number; goal: number; ratio: number; done: boolean };

export function dailyGoalProgress(todayXp: number, goal: number = DAILY_GOAL_XP): GoalProgress {
  const ratio = goal > 0 ? Math.min(1, Math.max(0, todayXp / goal)) : 1;
  return { current: todayXp, goal, ratio, done: todayXp >= goal };
}

/** Prochain palier strictement supérieur à la série courante (ou null). */
export function nextMilestone(current: number): number | null {
  return STREAK_MILESTONES.find((m) => m > current) ?? null;
}

export function isMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

/** Activité EFFECTIVE = jours réellement actifs ∪ jours protégés par un bouclier. */
export function effectiveDates(activity: readonly string[], frozen: readonly string[]): string[] {
  return [...new Set([...activity, ...frozen])];
}

export type FreezeState = { freezes: number; frozenDays: string[] };

/**
 * Applique un bouclier si la série est sur le point de casser à cause d'UN seul
 * jour raté (hier), et qu'un bouclier est disponible. On ne gaspille pas un
 * bouclier pour combler un trou de plusieurs jours. Fonction pure : renvoie le
 * nouvel état (l'appelant persiste).
 */
export function applyFreezeProtection(
  activity: readonly string[],
  state: FreezeState,
  today: string,
): FreezeState {
  const eff = new Set(effectiveDates(activity, state.frozenDays));
  const yesterday = previousDay(today);
  // Série vivante (actif aujourd'hui ou hier) → rien à protéger.
  if (eff.has(today) || eff.has(yesterday)) return state;
  // Hier manquant mais avant-hier présent → un seul trou, comblable.
  if (state.freezes > 0 && eff.has(previousDay(yesterday))) {
    return {
      freezes: state.freezes - 1,
      frozenDays: [...state.frozenDays, yesterday],
    };
  }
  return state;
}

/**
 * Gagne un bouclier quand l'objectif du jour est atteint (une fois par jour,
 * plafonné). `lastEarned` = dernière date où un bouclier a été gagné.
 */
export function maybeEarnFreeze(
  state: FreezeState,
  today: string,
  todayXp: number,
  lastEarned: string | null,
): { state: FreezeState; lastEarned: string } | null {
  if (todayXp < DAILY_GOAL_XP || lastEarned === today || state.freezes >= MAX_FREEZES) return null;
  return { state: { ...state, freezes: state.freezes + 1 }, lastEarned: today };
}

/** Série calculée sur l'activité EFFECTIVE (boucliers inclus). */
export function streakWithFreezes(
  activity: readonly string[],
  frozen: readonly string[],
  today: string,
): Streak {
  return computeStreak(effectiveDates(activity, frozen), today);
}
