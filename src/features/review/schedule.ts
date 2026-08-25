/**
 * Répétition espacée (système de Leitner simplifié).
 *
 * Une question ratée revient le lendemain, puis s'espace à chaque réussite
 * consécutive : 1, 3, 7, 16, 35 puis 90 jours. Une erreur remet le compteur à
 * zéro. Le but n'est pas la finesse d'un SM-2 mais un rendez-vous quotidien
 * honnête : ce qui est fragile revient vite, ce qui est acquis se fait rare.
 *
 * Fonctions pures, testées : la planification ne dépend d'aucune horloge cachée.
 */

/** Intervalles en jours, par nombre de réussites consécutives. */
export const REVIEW_STEPS = [1, 3, 7, 16, 35, 90] as const;

/** Au-delà, la question est considérée comme acquise (elle revient rarement). */
export const MASTERED_STREAK = REVIEW_STEPS.length;

export type ReviewState = {
  /** Réussites consécutives (0 après une erreur). */
  streak: number;
  /** Intervalle courant, en jours. */
  intervalDays: number;
  /** Prochaine échéance, clé de jour locale YYYY-MM-DD. */
  dueDate: string;
};

/** Ajoute `days` à une clé de jour locale, sans dépendre du fuseau UTC. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/**
 * Prochaine échéance après une réponse. `previous` absent = première rencontre.
 */
export function nextReview(
  previous: ReviewState | null,
  isCorrect: boolean,
  today: string,
): ReviewState {
  const streak = isCorrect ? Math.min((previous?.streak ?? 0) + 1, MASTERED_STREAK) : 0;
  // Une erreur ramène toujours au premier palier : on la revoit demain.
  const intervalDays = isCorrect ? REVIEW_STEPS[Math.min(streak, REVIEW_STEPS.length) - 1] : REVIEW_STEPS[0];
  return { streak, intervalDays, dueDate: addDays(today, intervalDays) };
}

/** La question est-elle à réviser aujourd'hui (échéance atteinte ou dépassée) ? */
export function isDue(state: Pick<ReviewState, 'dueDate'>, today: string): boolean {
  return state.dueDate <= today;
}

/** Question acquise : plus de rappel rapproché à prévoir. */
export function isMastered(state: Pick<ReviewState, 'streak'>): boolean {
  return state.streak >= MASTERED_STREAK;
}
