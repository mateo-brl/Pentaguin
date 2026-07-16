import { describe, expect, it } from '@jest/globals';

import type { MonetizationConfig } from '@/config/monetization';
import type { ContentPack, MockExam } from '@/content';

import { buildExamQuestions } from '../build';

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
    { id: 'd1', code: '1.0', title: 'Un', weightPercent: 50, order: 1 },
    { id: 'd2', code: '2.0', title: 'Deux', weightPercent: 50, order: 2 },
  ],
  lessons: [],
  questions: [
    ...['q-a', 'q-b', 'q-c', 'q-d'].map((id) => question(id, 'd1')),
    ...['q-e', 'q-f', 'q-g', 'q-h'].map((id) => question(id, 'd2')),
  ],
  exams: [],
} satisfies ContentPack;

const exam = (questionCount: number): MockExam => ({
  id: 'exam-test',
  title: 'Examen test',
  durationMin: 90,
  questionCount,
  selection: 'weighted',
});

const off: MonetizationConfig = {
  enabled: false,
  free: { domainIds: [], questionRatioPerDomain: 0, mockExamCount: 0 },
  upsell: { maxSpontaneousPrompts: 1 },
};

const restricted: MonetizationConfig = {
  enabled: true,
  free: { domainIds: ['d1'], questionRatioPerDomain: 0.5, mockExamCount: 1 },
  upsell: { maxSpontaneousPrompts: 1 },
};

const none = new Set<string>();
const makeRng = (seed: number) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

describe('buildExamQuestions', () => {
  it('répartit au prorata des poids', () => {
    const result = buildExamQuestions(pack, exam(4), none, off, makeRng(1));
    expect(result).toHaveLength(4);
    expect(result.filter((q) => q.domainId === 'd1')).toHaveLength(2);
    expect(result.filter((q) => q.domainId === 'd2')).toHaveLength(2);
  });

  it('redistribue quand un domaine manque de questions (banque gatée)', () => {
    // d2 non gratuit ratio 0.5 → pool de 2 ; quota 3 → d1 compense
    const result = buildExamQuestions(pack, exam(6), none, restricted, makeRng(2));
    expect(result).toHaveLength(6);
    expect(result.filter((q) => q.domainId === 'd2')).toHaveLength(2);
    expect(result.filter((q) => q.domainId === 'd1')).toHaveLength(4);
  });

  it('ne déborde pas la banque globale et ne duplique pas', () => {
    const result = buildExamQuestions(pack, exam(90), none, off, makeRng(3));
    expect(result).toHaveLength(8);
    expect(new Set(result.map((q) => q.id)).size).toBe(8);
  });
});
