import type { PlacementQuestion } from '@/content/placement';

/**
 * Moteur de positionnement adaptatif — 100 % pur et testé. On part au milieu de
 * l'échelle (niveau 8) ; une bonne réponse fait monter, une mauvaise descendre,
 * avec un pas qui se resserre vite. L'estimation courante est un FLOTTANT (jamais
 * arrondie en cours de route), et le rang final est la MOYENNE de la seconde
 * moitié du parcours (lissée, robuste au bruit).
 *
 * Escalier ASYMÉTRIQUE : une mauvaise réponse descend `DOWN_FACTOR`× plus qu'une
 * bonne ne monte. Sur un QCM à 4 choix, la devinette (25 %) tire l'estimation
 * vers le haut ; ce facteur recale l'équilibre sur le vrai niveau du candidat
 * (mesuré par simulation : biais quasi nul, erreur ~0,6 rang).
 */

/** Pas de base appliqués après chaque réponse (30 questions au total). */
export const PLACEMENT_STEPS = [
  4, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
] as const;
export const PLACEMENT_TOTAL = PLACEMENT_STEPS.length; // 30
export const START_LEVEL = 8;
/** Une mauvaise réponse descend ce multiple du pas (corrige le biais de devinette).
 *  Calé par simulation : 1,7 → biais quasi nul, erreur ~0,6 rang. */
export const DOWN_FACTOR = 1.7;
const MIN = 1;
const MAX = 15;

export type PlacementState = {
  /** Niveau estimé courant, flottant 1-15. */
  currentLevel: number;
  /** Nombre de réponses déjà données (= index du prochain pas). */
  step: number;
  /** Ids déjà posés (jamais re-posés). */
  askedIds: string[];
  /** Historique du niveau estimé après chaque réponse (pour le lissage final). */
  levels: number[];
  correctCount: number;
};

/** Borne 1-15 sans arrondir (l'estimation reste flottante pendant le parcours). */
const bound = (n: number) => Math.min(Math.max(n, MIN), MAX);
const clampRound = (n: number) => Math.min(Math.max(Math.round(n), MIN), MAX);

export function initPlacement(): PlacementState {
  return { currentLevel: START_LEVEL, step: 0, askedIds: [], levels: [], correctCount: 0 };
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
  downFactor: number = DOWN_FACTOR,
): PlacementState {
  const stepSize = PLACEMENT_STEPS[Math.min(state.step, PLACEMENT_STEPS.length - 1)];
  const delta = correct ? stepSize : -stepSize * downFactor;
  const currentLevel = bound(state.currentLevel + delta);
  return {
    currentLevel,
    step: state.step + 1,
    askedIds: [...(state.askedIds ?? []), question.id],
    // `?? []` : tolère un état hérité d'une version antérieure sans `levels`.
    levels: [...(state.levels ?? []), currentLevel],
    correctCount: state.correctCount + (correct ? 1 : 0),
  };
}

/**
 * Rang final (1-15) : moyenne lissée de la seconde moitié du parcours (après
 * convergence), arrondie. Repli sur le niveau courant si l'historique est vide.
 */
export function finalRank(state: PlacementState): number {
  const levels = state.levels ?? [];
  if (levels.length === 0) return clampRound(state.currentLevel);
  const tail = levels.slice(Math.floor(levels.length / 2));
  const mean = tail.reduce((sum, l) => sum + l, 0) / tail.length;
  return clampRound(mean);
}
