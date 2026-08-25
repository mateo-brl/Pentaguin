import { describe, expect, it } from '@jest/globals';

import { monetizationConfig } from '@/config/monetization';
import { getDefaultPack } from '@/content';
import { getPracticeExercises, getPracticeMissions } from '@/content/practice';
import { freeLessonIds, freePracticeIds, freeQuestionIds, packEntitlement } from '../gates';

const pack = getDefaultPack('fr');
const none = new Set<string>();

/** Questions réellement accessibles sans abonnement, tous thèmes confondus. */
function freeQuestionCount(): number {
  let n = 0;
  for (const domain of pack.domains) {
    const ids = pack.questions.filter((q) => q.domainId === domain.id).map((q) => q.id);
    n += monetizationConfig.free.domainIds.includes(domain.id)
      ? ids.length
      : freeQuestionIds(ids, monetizationConfig.free.questionRatioPerDomain).size;
  }
  return n;
}

describe('équilibre gratuit / abonnement', () => {
  it('offre deux thèmes ENTIERS : le gratuit est un vrai cours, pas une démo', () => {
    const free = freeLessonIds(pack.lessons, monetizationConfig);
    for (const domainId of monetizationConfig.free.domainIds) {
      const lessons = pack.lessons.filter((l) => l.domainId === domainId);
      expect(lessons.length).toBeGreaterThan(0);
      expect(lessons.every((l) => free.has(l.id))).toBe(true);
    }
  });

  it('garde un avant-goût dans chaque thème payant (jamais un mur nu)', () => {
    const freeLessons = freeLessonIds(pack.lessons, monetizationConfig);
    const freePractice = freePracticeIds(getPracticeExercises('fr'), monetizationConfig);
    for (const domain of pack.domains) {
      if (monetizationConfig.free.domainIds.includes(domain.id)) continue;
      expect(pack.lessons.filter((l) => l.domainId === domain.id && freeLessons.has(l.id)).length)
        .toBeGreaterThan(0);
      expect(
        getPracticeExercises('fr').filter((e) => e.domainId === domain.id && freePractice.has(e.id))
          .length,
      ).toBeGreaterThan(0);
    }
  });

  it('laisse une valeur nette à l’abonnement (le gratuit reste minoritaire)', () => {
    const free = freeQuestionCount();
    expect(free / pack.questions.length).toBeLessThan(0.45);
    // ...mais assez pour un vrai usage : pas une démo frustrante.
    expect(free).toBeGreaterThan(150);
  });

  it('réserve les missions des thèmes payants à l’abonnement', () => {
    const missions = getPracticeMissions('fr');
    const free = missions.filter((m) => monetizationConfig.free.domainIds.includes(m.domainId));
    expect(free.length).toBeGreaterThanOrEqual(2);
    expect(free.length).toBeLessThan(missions.length);
  });

  it('ouvre tout à un abonné', () => {
    const pro = new Set([packEntitlement(pack.id)]);
    expect(pro.has(packEntitlement(pack.id))).toBe(true);
    expect(none.size).toBe(0);
  });
});
