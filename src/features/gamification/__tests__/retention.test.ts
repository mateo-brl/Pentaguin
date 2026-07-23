import { describe, expect, it } from '@jest/globals';

import {
  applyFreezeProtection,
  dailyGoalProgress,
  DAILY_GOAL_XP,
  isMilestone,
  maybeEarnFreeze,
  MAX_FREEZES,
  nextMilestone,
  streakWithFreezes,
} from '../retention';

describe('dailyGoalProgress', () => {
  it('borne le ratio et détecte l’objectif atteint', () => {
    expect(dailyGoalProgress(0)).toMatchObject({ ratio: 0, done: false });
    expect(dailyGoalProgress(15)).toMatchObject({ ratio: 0.5, done: false });
    expect(dailyGoalProgress(DAILY_GOAL_XP)).toMatchObject({ ratio: 1, done: true });
    expect(dailyGoalProgress(999).ratio).toBe(1); // jamais > 1
  });
});

describe('paliers', () => {
  it('trouve le prochain palier et reconnaît un palier', () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(365)).toBeNull();
    expect(isMilestone(7)).toBe(true);
    expect(isMilestone(8)).toBe(false);
  });
});

describe('bouclier de série', () => {
  it('protège UN jour raté isolé quand un bouclier est dispo', () => {
    // actif avant-hier, rien hier ni aujourd'hui, 1 bouclier
    const next = applyFreezeProtection(['2026-07-18'], { freezes: 1, frozenDays: [] }, '2026-07-20');
    expect(next.freezes).toBe(0);
    expect(next.frozenDays).toContain('2026-07-19');
    // la série survit grâce au jour gelé
    expect(streakWithFreezes(['2026-07-18'], next.frozenDays, '2026-07-20').current).toBe(2);
  });

  it('ne gaspille pas un bouclier pour un trou de plusieurs jours', () => {
    // dernier jour actif = il y a 3 jours → 2 trous, non comblable
    const s = { freezes: 1, frozenDays: [] };
    expect(applyFreezeProtection(['2026-07-17'], s, '2026-07-20')).toEqual(s);
  });

  it('ne fait rien si la série est encore vivante (actif hier)', () => {
    const s = { freezes: 1, frozenDays: [] };
    expect(applyFreezeProtection(['2026-07-19'], s, '2026-07-20')).toEqual(s);
  });

  it('ne fait rien sans bouclier', () => {
    const s = { freezes: 0, frozenDays: [] };
    expect(applyFreezeProtection(['2026-07-18'], s, '2026-07-20')).toEqual(s);
  });
});

describe('gain de bouclier', () => {
  it('accorde un bouclier à l’objectif atteint, une fois par jour, plafonné', () => {
    const base = { freezes: 0, frozenDays: [] };
    expect(maybeEarnFreeze(base, '2026-07-20', DAILY_GOAL_XP, null)?.state.freezes).toBe(1);
    // objectif non atteint → rien
    expect(maybeEarnFreeze(base, '2026-07-20', DAILY_GOAL_XP - 1, null)).toBeNull();
    // déjà gagné aujourd'hui → rien
    expect(maybeEarnFreeze(base, '2026-07-20', DAILY_GOAL_XP, '2026-07-20')).toBeNull();
    // plafond atteint → rien
    expect(maybeEarnFreeze({ freezes: MAX_FREEZES, frozenDays: [] }, '2026-07-20', 999, null)).toBeNull();
  });
});
