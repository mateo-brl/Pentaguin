import { describe, expect, it } from '@jest/globals';

import type { PlacementQuestion } from '@/content/placement';

import {
  applyAnswer,
  finalRank,
  initPlacement,
  isPlacementDone,
  nextQuestion,
  PLACEMENT_TOTAL,
  type PlacementState,
} from '../engine';

/** Banque synthétique : plusieurs questions par difficulté 1-15. */
function makeBank(perLevel = 6): PlacementQuestion[] {
  const bank: PlacementQuestion[] = [];
  for (let d = 1; d <= 15; d += 1) {
    for (let i = 0; i < perLevel; i += 1) {
      bank.push({
        id: `d${d}-${i}`,
        difficulty: d,
        stem: `q ${d}-${i}`,
        choices: [
          { id: 'a', text: 'a' },
          { id: 'b', text: 'b' },
        ],
        correct: 'a',
        tags: ['placement-v1'],
      });
    }
  }
  return bank;
}

const rng0 = () => 0; // déterministe : prend toujours le premier finaliste

/** Joue tout le test : `isCorrect(q)` décide de la réponse. */
function run(
  bank: PlacementQuestion[],
  isCorrect: (q: PlacementQuestion) => boolean,
): PlacementState {
  let state = initPlacement();
  while (!isPlacementDone(state)) {
    const q = nextQuestion(bank, state, rng0);
    expect(q).not.toBeNull();
    state = applyAnswer(state, q!, isCorrect(q!));
  }
  return state;
}

describe('moteur de positionnement', () => {
  it('pose exactement 30 questions sans répétition', () => {
    expect(PLACEMENT_TOTAL).toBe(30);
    const state = run(makeBank(), () => true);
    expect(state.step).toBe(PLACEMENT_TOTAL);
    expect(state.askedIds).toHaveLength(PLACEMENT_TOTAL);
    expect(new Set(state.askedIds).size).toBe(PLACEMENT_TOTAL);
  });

  it('converge vers le rang max quand tout est juste', () => {
    expect(finalRank(run(makeBank(), () => true))).toBe(15);
  });

  it('converge vers le rang min quand tout est faux', () => {
    expect(finalRank(run(makeBank(), () => false))).toBe(1);
  });

  it('situe un profil moyen près de son vrai niveau', () => {
    for (const skill of [4, 8, 11]) {
      const rank = finalRank(run(makeBank(), (q) => q.difficulty <= skill));
      expect(rank).toBeGreaterThanOrEqual(skill - 2);
      expect(rank).toBeLessThanOrEqual(skill + 2);
    }
  });

  it('choisit une question de difficulté proche du niveau courant', () => {
    const bank = makeBank();
    const q = nextQuestion(bank, initPlacement(), rng0); // niveau de départ 8
    expect(q?.difficulty).toBe(8);
  });

  it('est déterministe (même rng + mêmes réponses → même résultat)', () => {
    const a = run(makeBank(), (q) => q.difficulty <= 7);
    const b = run(makeBank(), (q) => q.difficulty <= 7);
    expect(a).toEqual(b);
  });

  it('tolère un état hérité sans le champ levels (ne crash pas)', () => {
    const bank = makeBank();
    // État tel que produit par une ANCIENNE version du moteur (pas de `levels`).
    const legacy = { currentLevel: 8, step: 2, askedIds: ['d8-0'], correctCount: 1 } as never;
    const q = nextQuestion(bank, legacy, rng0)!;
    expect(() => applyAnswer(legacy, q, true)).not.toThrow();
    const next = applyAnswer(legacy, q, true);
    expect(next.levels).toHaveLength(1);
    expect(() => finalRank(legacy)).not.toThrow();
  });

  it('descend plus fort qu’il ne monte (correction du biais de devinette)', () => {
    const bank = makeBank();
    const s0 = initPlacement();
    const q = nextQuestion(bank, s0, rng0)!;
    const up = applyAnswer(s0, q, true).currentLevel - s0.currentLevel;
    const down = s0.currentLevel - applyAnswer(s0, q, false).currentLevel;
    expect(down).toBeGreaterThan(up);
  });
});
