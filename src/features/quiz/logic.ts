import type { Question } from '@/content';

/** Égalité stricte d'ensembles entre sélection et réponses attendues. */
export function isAnswerCorrect(
  question: Pick<Question, 'correct'>,
  selected: readonly string[],
): boolean {
  if (selected.length !== question.correct.length) return false;
  const expected = new Set(question.correct);
  return selected.every((choiceId) => expected.has(choiceId));
}

export function scorePct(correctCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 100);
}

export type Rng = () => number;

/** Générateur pseudo-aléatoire déterministe (LCG) — tirages rejouables (défi du jour, tests). */
export function seededRng(seed: number): Rng {
  let state = seed % 233280;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Fisher-Yates, rng injectable pour les tests. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickQuestions<T>(available: readonly T[], count: number, rng: Rng = Math.random): T[] {
  return shuffle(available, rng).slice(0, Math.max(0, Math.min(count, available.length)));
}
