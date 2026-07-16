import { describe, expect, it } from '@jest/globals';

import type { MonetizationConfig } from '@/config/monetization';
import type { ContentPack } from '@/content';
import { packEntitlement } from '@/features/monetization';

import { playableQuestions } from '../select';

const question = (id: string, domainId: string) => ({
  id,
  domainId,
  type: 'single' as const,
  stem: 'stem',
  choices: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  correct: ['a'],
  explanation: 'une explication suffisamment longue',
  difficulty: 1 as const,
  tags: [],
});

const pack = {
  id: 'pack-test',
  certName: 'Test',
  examCode: 'T-000',
  locale: 'fr',
  version: 1,
  domains: [
    { id: 'd1', code: '1.0', title: 'Gratuit', weightPercent: 50, order: 1 },
    { id: 'd2', code: '2.0', title: 'Payant', weightPercent: 50, order: 2 },
  ],
  lessons: [],
  questions: [
    question('q-a', 'd1'),
    question('q-b', 'd1'),
    question('q-c', 'd2'),
    question('q-d', 'd2'),
    question('q-e', 'd2'),
    question('q-f', 'd2'),
  ],
  exams: [],
} satisfies ContentPack;

const config: MonetizationConfig = {
  enabled: true,
  free: { domainIds: ['d1'], questionRatioPerDomain: 0.5, mockExamCount: 1 },
  upsell: { maxSpontaneousPrompts: 1 },
};

const none = new Set<string>();
const pro = new Set([packEntitlement(pack.id)]);

describe('playableQuestions', () => {
  it('donne la banque complète d’un domaine gratuit', () => {
    expect(playableQuestions(pack, 'd1', none, config).map((q) => q.id)).toEqual(['q-a', 'q-b']);
  });

  it('réduit un domaine payant au sous-ensemble gratuit', () => {
    const ids = playableQuestions(pack, 'd2', none, config).map((q) => q.id);
    expect(ids).toEqual(['q-c', 'q-d']); // 50 % de 4, sous-ensemble stable trié
  });

  it('donne tout avec l’entitlement du pack', () => {
    expect(playableQuestions(pack, 'd2', pro, config)).toHaveLength(4);
    expect(playableQuestions(pack, null, pro, config)).toHaveLength(6);
  });

  it('cumule les domaines quand domainId est null', () => {
    expect(playableQuestions(pack, null, none, config)).toHaveLength(4); // 2 gratuits + 2/4
  });

  it('monétisation coupée : tout est jouable', () => {
    const off = { ...config, enabled: false };
    expect(playableQuestions(pack, null, none, off)).toHaveLength(6);
  });
});
