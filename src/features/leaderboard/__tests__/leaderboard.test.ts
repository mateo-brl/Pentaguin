import { describe, expect, it } from '@jest/globals';

import { buildSyncPayload } from '../api';
import { isValidPseudo } from '../identity';

describe('isValidPseudo', () => {
  it('accepte des pseudos raisonnables', () => {
    expect(isValidPseudo('Tux')).toBe(true);
    expect(isValidPseudo('Mateo B.')).toBe(true);
    expect(isValidPseudo('agent_007')).toBe(true);
    expect(isValidPseudo('Éléa-Zoé')).toBe(true);
  });

  it('refuse trop court, trop long ou caractères spéciaux', () => {
    expect(isValidPseudo('ab')).toBe(false);
    expect(isValidPseudo('a'.repeat(21))).toBe(false);
    expect(isValidPseudo('<script>')).toBe(false);
    expect(isValidPseudo('pseudo\nnewline')).toBe(false);
  });
});

describe('buildSyncPayload', () => {
  const activity = Array.from({ length: 90 }, (_, i) => ({
    date: `2026-04-${String((i % 30) + 1).padStart(2, '0')}`,
    xp: i,
  }));

  it('limite aux 60 derniers jours', () => {
    const payload = buildSyncPayload('id-123', 'Tux', activity);
    expect(payload.days).toHaveLength(60);
    expect(payload.days[59]).toEqual(activity[89]);
  });

  it('nettoie le pseudo', () => {
    expect(buildSyncPayload('id', '  Tux  ', []).pseudo).toBe('Tux');
  });

  it('inclut le rang quand fourni, l’omet sinon', () => {
    expect(buildSyncPayload('id', 'Tux', [], 7).rank).toBe(7);
    expect(buildSyncPayload('id', 'Tux', []).rank).toBeUndefined();
  });
});
