import { describe, expect, it } from '@jest/globals';

import type { ContentPack, Lesson } from '@/content';

import { isRecommended, recommendedLessons } from '../recommend';

function lesson(id: string, level: number): Lesson {
  return {
    id,
    domainId: 'd-x',
    title: id,
    order: 1,
    estMinutes: 5,
    level,
    blocks: [{ type: 'text', md: 'x' }],
  };
}

const pack = {
  lessons: [lesson('l1', 1), lesson('l5', 5), lesson('l7', 7), lesson('l8', 8), lesson('l9', 9), lesson('l14', 14)],
} as unknown as ContentPack;

describe('recommendedLessons', () => {
  it('retient les leçons proches du rang, triées par proximité', () => {
    const out = recommendedLessons(pack, 8).map((l) => l.id);
    expect(out).toEqual(['l8', 'l7', 'l9']); // |level-8| = 0,1,1
  });

  it('respecte la fenêtre (aucune leçon hors portée)', () => {
    expect(recommendedLessons(pack, 8).every((l) => Math.abs((l.level as number) - 8) <= 1)).toBe(
      true,
    );
  });

  it('respecte la limite', () => {
    expect(recommendedLessons(pack, 8, { window: 20, limit: 2 })).toHaveLength(2);
  });

  it('exclut les leçons déjà terminées', () => {
    const out = recommendedLessons(pack, 8, { exclude: new Set(['l8']) }).map((l) => l.id);
    expect(out).toEqual(['l7', 'l9']);
  });

  it('isRecommended vrai dans la fenêtre, faux au-delà', () => {
    expect(isRecommended(lesson('a', 8), 8)).toBe(true);
    expect(isRecommended(lesson('a', 9), 8)).toBe(true);
    expect(isRecommended(lesson('a', 11), 8)).toBe(false);
  });
});
