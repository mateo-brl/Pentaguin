import type { PlacementQuestion } from '@/content/placement';

/**
 * Moteur de positionnement adaptatif — 100 % pur et testé. On part au milieu de
 * l'échelle (niveau 8) ; une bonne réponse fait monter, une mauvaise descendre,
 * avec un pas qui se resserre → convergence vers l'un des 15 rangs en 12 questions.
 */

/** Pas appliqués après chaque réponse (12 questions au total). */
export const PLACEMENT_STEPS = [4, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;
export const PLACEMENT_TOTAL = PLACEMENT_STEPS.length; // 12
export const START_LEVEL = 8;
const MIN = 1;
const MAX = 15;

export type PlacementState = {
  /** Niveau estimé courant (1-15). */
  currentLevel: number;
  /** Nombre de réponses déjà données (= index du prochain pas). */
  step: number;
  /** Ids déjà posés (jamais re-posés). */
  askedIds: string[];
  correctCount: number;
};

const clamp = (n: number) => Math.min(Math.max(Math.round(n), MIN), MAX);

export function initPlacement(): PlacementState {
  return { currentLevel: START_LEVEL, step: 0, askedIds: [], correctCount: 0 };
}

export function isPlacementDone(state: PlacementState): boolean {
  return state.step >= PLACEMENT_TOTAL;
}

/**
 * Choisit la prochaine question : non encore posée, de difficulté la plus proche
 * du niveau courant ; à égalité de distance on prend la difficulté la plus basse,
 * et entre questions de même difficulté on tire au sort (rng injectable pour tests).
 */
export function nextQuestion(
  bank: PlacementQuestion[],
  state: PlacementState,
  rng: () => number = Math.random,
): PlacementQuestion | null {
  if (isPlacementDone(state)) return null;
  const asked = new Set(state.askedIds);
  const pool = bank.filter((q) => !asked.has(q.id));
  if (pool.length === 0) return null;

  let bestDist = Infinity;
  let best: PlacementQuestion[] = [];
  for (const q of pool) {
    const dist = Math.abs(q.difficulty - state.currentLevel);
    if (dist < bestDist) {
      bestDist = dist;
      best = [q];
    } else if (dist === bestDist) {
      best.push(q);
    }
  }
  const lowestDiff = Math.min(...best.map((q) => q.difficulty));
  const finalists = best.filter((q) => q.difficulty === lowestDiff);
  return finalists[Math.floor(rng() * finalists.length)] ?? finalists[0];
}

/** Applique une réponse et renvoie le nouvel état (immuable). */
export function applyAnswer(
  state: PlacementState,
  question: PlacementQuestion,
  correct: boolean,
): PlacementState {
  const stepSize = PLACEMENT_STEPS[Math.min(state.step, PLACEMENT_STEPS.length - 1)];
  const delta = correct ? stepSize : -stepSize;
  return {
    currentLevel: clamp(state.currentLevel + delta),
    step: state.step + 1,
    askedIds: [...state.askedIds, question.id],
    correctCount: state.correctCount + (correct ? 1 : 0),
  };
}

/** Rang final (1-15) une fois le test terminé. */
export function finalRank(state: PlacementState): number {
  return clamp(state.currentLevel);
}
