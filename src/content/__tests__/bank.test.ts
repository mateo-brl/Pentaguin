import { describe, expect, it } from '@jest/globals';

import { getDefaultPack } from '@/content';
import { packEntitlement } from '@/features/monetization';
import { buildExamQuestions } from '@/features/exam/build';

describe('banque jouable élargie', () => {
  const pack = getDefaultPack('fr');

  it('fusionne la banque de positionnement dans le pack', () => {
    // 64 questions rédigées + 450 issues du positionnement
    expect(pack.questions.length).toBe(514);
    expect(new Set(pack.questions.map((q) => q.id)).size).toBe(pack.questions.length);
  });

  it('rattache chaque question à un domaine connu et à une difficulté valide', () => {
    const domainIds = new Set(pack.domains.map((d) => d.id));
    for (const q of pack.questions) {
      expect(domainIds.has(q.domainId)).toBe(true);
      expect([1, 2, 3]).toContain(q.difficulty);
      expect(q.correct.every((c) => q.choices.some((choice) => choice.id === c))).toBe(true);
    }
  });

  it('donne à chaque thème de quoi jouer un quiz', () => {
    for (const domain of pack.domains) {
      const n = pack.questions.filter((q) => q.domainId === domain.id).length;
      expect(n).toBeGreaterThanOrEqual(10);
    }
  });

  it('permet de construire les examens blancs au complet (utilisateur Pro)', () => {
    const pro = new Set([packEntitlement(pack.id)]);
    expect(pack.exams.length).toBeGreaterThan(0);
    for (const exam of pack.exams) {
      const questions = buildExamQuestions(pack, exam, pro);
      expect(questions.length).toBe(exam.questionCount);
      expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    }
  });

  it('reste jouable pour un utilisateur gratuit (examen offert non vide)', () => {
    const free = buildExamQuestions(pack, pack.exams[0], new Set());
    expect(free.length).toBeGreaterThanOrEqual(40);
    expect(new Set(free.map((q) => q.id)).size).toBe(free.length);
  });

  it('garde la parité FR/EN sur les ids de la banque', () => {
    const en = getDefaultPack('en');
    expect(new Set(en.questions.map((q) => q.id))).toEqual(
      new Set(pack.questions.map((q) => q.id)),
    );
  });
});
