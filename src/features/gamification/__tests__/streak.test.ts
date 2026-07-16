import { describe, expect, it } from '@jest/globals';

import { computeStreak, previousDay } from '../streak';

describe('previousDay', () => {
  it('gère les bords de mois et d’année', () => {
    expect(previousDay('2026-07-01')).toBe('2026-06-30');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
    expect(previousDay('2024-03-01')).toBe('2024-02-29'); // bissextile
  });
});

describe('computeStreak', () => {
  const today = '2026-07-16';

  it('sans activité : 0/0', () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0 });
  });

  it('activité aujourd’hui seulement : 1', () => {
    expect(computeStreak(['2026-07-16'], today)).toEqual({ current: 1, longest: 1 });
  });

  it('chaîne se terminant aujourd’hui', () => {
    expect(computeStreak(['2026-07-14', '2026-07-15', '2026-07-16'], today).current).toBe(3);
  });

  it('hier sans aujourd’hui : série encore sauvable', () => {
    expect(computeStreak(['2026-07-14', '2026-07-15'], today).current).toBe(2);
  });

  it('trou avant-hier : série cassée', () => {
    expect(computeStreak(['2026-07-13', '2026-07-14'], today).current).toBe(0);
  });

  it('longest indépendant de la série courante', () => {
    const dates = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-16'];
    expect(computeStreak(dates, today)).toEqual({ current: 1, longest: 4 });
  });
});
