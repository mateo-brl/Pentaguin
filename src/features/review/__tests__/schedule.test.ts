import { describe, expect, it } from '@jest/globals';

import { addDays, isDue, isMastered, nextReview, REVIEW_STEPS } from '../schedule';

describe('addDays', () => {
  it('avance sans casser sur les fins de mois et les années bissextiles', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-07-01', 0)).toBe('2026-07-01');
  });
});

describe('nextReview', () => {
  it('programme une première réussite au premier palier', () => {
    const state = nextReview(null, true, '2026-07-01');
    expect(state.streak).toBe(1);
    expect(state.intervalDays).toBe(REVIEW_STEPS[0]);
    expect(state.dueDate).toBe('2026-07-02');
  });

  it('espace à chaque réussite consécutive', () => {
    let state = nextReview(null, true, '2026-07-01');
    const seen = [state.intervalDays];
    for (let i = 0; i < 5; i += 1) {
      state = nextReview(state, true, state.dueDate);
      seen.push(state.intervalDays);
    }
    expect(seen).toEqual([...REVIEW_STEPS]);
  });

  it('ramène une erreur au lendemain et remet la série à zéro', () => {
    const acquired = { streak: 4, intervalDays: 35, dueDate: '2026-08-05' };
    const state = nextReview(acquired, false, '2026-08-05');
    expect(state.streak).toBe(0);
    expect(state.intervalDays).toBe(1);
    expect(state.dueDate).toBe('2026-08-06');
  });

  it('plafonne l’intervalle une fois la question acquise', () => {
    let state = { streak: 6, intervalDays: 90, dueDate: '2026-08-01' };
    state = nextReview(state, true, '2026-08-01');
    expect(state.intervalDays).toBe(90);
    expect(isMastered(state)).toBe(true);
  });
});

describe('isDue', () => {
  it('inclut les échéances dépassées', () => {
    expect(isDue({ dueDate: '2026-07-01' }, '2026-07-05')).toBe(true);
    expect(isDue({ dueDate: '2026-07-05' }, '2026-07-05')).toBe(true);
    expect(isDue({ dueDate: '2026-07-06' }, '2026-07-05')).toBe(false);
  });
});
