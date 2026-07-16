import { describe, expect, it } from '@jest/globals';

import { isAnswerCorrect, pickQuestions, scorePct, shuffle } from '../logic';

describe('isAnswerCorrect', () => {
  it('valide une réponse single exacte', () => {
    expect(isAnswerCorrect({ correct: ['b'] }, ['b'])).toBe(true);
    expect(isAnswerCorrect({ correct: ['b'] }, ['a'])).toBe(false);
  });

  it('exige l’égalité d’ensembles en multi (ordre indifférent)', () => {
    expect(isAnswerCorrect({ correct: ['a', 'c'] }, ['c', 'a'])).toBe(true);
    expect(isAnswerCorrect({ correct: ['a', 'c'] }, ['a'])).toBe(false);
    expect(isAnswerCorrect({ correct: ['a', 'c'] }, ['a', 'c', 'd'])).toBe(false);
    expect(isAnswerCorrect({ correct: ['a', 'c'] }, ['a', 'd'])).toBe(false);
  });

  it('refuse une sélection vide', () => {
    expect(isAnswerCorrect({ correct: ['a'] }, [])).toBe(false);
  });
});

describe('scorePct', () => {
  it('arrondit au pourcentage entier', () => {
    expect(scorePct(7, 10)).toBe(70);
    expect(scorePct(2, 3)).toBe(67);
    expect(scorePct(0, 10)).toBe(0);
  });

  it('gère le total zéro', () => {
    expect(scorePct(0, 0)).toBe(0);
  });
});

describe('shuffle / pickQuestions', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  // rng déterministe pour des tests reproductibles
  const makeRng = (seed: number) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  it('shuffle préserve les éléments', () => {
    const result = shuffle(items, makeRng(42));
    expect([...result].sort()).toEqual([...items].sort());
    expect(result).toHaveLength(items.length);
  });

  it('shuffle ne modifie pas le tableau d’origine', () => {
    const copy = [...items];
    shuffle(items, makeRng(1));
    expect(items).toEqual(copy);
  });

  it('pickQuestions retourne count éléments sans doublon', () => {
    const result = pickQuestions(items, 3, makeRng(7));
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it('pickQuestions borne count à la taille disponible', () => {
    expect(pickQuestions(items, 50, makeRng(7))).toHaveLength(5);
    expect(pickQuestions([], 10, makeRng(7))).toHaveLength(0);
  });
});
