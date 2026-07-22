import { create } from 'zustand';

import { XP } from '@/config/gamification';
import type { MockExam, Question } from '@/content';
import {
  addDailyXp,
  bumpQuestionStat,
  createAttempt,
  finishAttempt,
  recordAnswer,
} from '@/db/repositories';
import { isAnswerCorrect, scorePct } from '@/features/quiz/logic';

type ExamSessionState = {
  packId: string | null;
  attemptId: string | null;
  exam: MockExam | null;
  questions: Question[];
  currentIndex: number;
  /** Sélections par question — AUCUN verdict avant la fin (conditions réelles). */
  selections: Record<string, string[]>;
  flagged: Record<string, boolean>;
  endsAt: number | null;
  finished: boolean;
  start(packId: string, exam: MockExam, questions: Question[]): void;
  select(questionId: string, choiceIds: string[]): void;
  toggleFlag(questionId: string): void;
  goTo(index: number): void;
  /** Clôt l'examen (manuel ou temps écoulé) : les non-réponses comptent fausses. */
  finish(): void;
  reset(): void;
};

const initial = {
  packId: null,
  attemptId: null,
  exam: null,
  questions: [],
  currentIndex: 0,
  selections: {},
  flagged: {},
  endsAt: null,
  finished: false,
} satisfies Partial<ExamSessionState>;

export const useExamSession = create<ExamSessionState>((set, get) => ({
  ...initial,

  start(packId, exam, questions) {
    const attemptId = createAttempt(
      packId,
      'exam',
      questions.map((q) => q.id),
      exam.id,
    );
    set({
      ...initial,
      packId,
      attemptId,
      exam,
      questions,
      endsAt: Date.now() + exam.durationMin * 60_000,
    });
  },

  select(questionId, choiceIds) {
    set({ selections: { ...get().selections, [questionId]: choiceIds } });
  },

  toggleFlag(questionId) {
    const flagged = { ...get().flagged };
    flagged[questionId] = !flagged[questionId];
    set({ flagged });
  },

  goTo(index) {
    const { questions } = get();
    if (index >= 0 && index < questions.length) set({ currentIndex: index });
  },

  finish() {
    const { attemptId, packId, questions, selections, finished } = get();
    if (finished) return;
    if (attemptId && packId) {
      let correctCount = 0;
      for (const question of questions) {
        const selected = selections[question.id] ?? [];
        const isCorrect = isAnswerCorrect(question, selected);
        if (isCorrect) correctCount += 1;
        recordAnswer(attemptId, question.id, selected, isCorrect);
        // Ne pollue « Mes erreurs » qu'avec les questions RÉELLEMENT vues :
        // une non-réponse (temps écoulé/abandon) compte faux au SCORE, mais ne
        // doit pas marquer comme ratée une question jamais affichée.
        if (question.id in selections) bumpQuestionStat(packId, question.id, isCorrect);
      }
      finishAttempt(attemptId, scorePct(correctCount, questions.length));
      if (correctCount > 0) addDailyXp(correctCount * XP.correctAnswer);
    }
    set({ finished: true });
  },

  reset() {
    set({ ...initial });
  },
}));
