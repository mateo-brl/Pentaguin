import { describe, expect, it } from '@jest/globals';

import { getPracticeExercises } from '@/content/practice';

import { isCorrectOrder, matchTerminalStep, validateExercise } from '../logic';

describe('matchTerminalStep', () => {
  const step = { instruction: '', expect: '^(ss|netstat)\\b', output: '' };
  it('accepte une commande conforme (insensible à la casse, espaces)', () => {
    expect(matchTerminalStep('ss -tunp', step)).toBe(true);
    expect(matchTerminalStep('  NETSTAT -a ', step)).toBe(true);
  });
  it('refuse une commande hors sujet', () => {
    expect(matchTerminalStep('ls -la', step)).toBe(false);
  });
});

describe('isCorrectOrder', () => {
  it('vrai seulement pour la séquence exacte', () => {
    expect(isCorrectOrder(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(isCorrectOrder(['a', 'c', 'b'], ['a', 'b', 'c'])).toBe(false);
    expect(isCorrectOrder(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});

describe('banque de pratique (témoin)', () => {
  it('parse et valide chaque exercice sans erreur', () => {
    const all = getPracticeExercises();
    expect(all.length).toBeGreaterThanOrEqual(4);
    for (const ex of all) expect(validateExercise(ex)).toEqual([]);
  });
});
