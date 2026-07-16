import { create } from 'zustand';

import { XP } from '@/config/gamification';
import type { Question } from '@/content';
import {
  addDailyXp,
  bumpQuestionStat,
  createAttempt,
  finishAttempt,
  recordAnswer,
} from '@/db/repositories';

import { isAnswerCorrect, scorePct } from './logic';

export type AnswerRecord = { selected: string[]; isCorrect: boolean };

type QuizSessionState = {
  packId: string | null;
  attemptId: string | null;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  finished: boolean;
  start(packId: string, questions: Question[]): void;
  /** Enregistre la réponse à la question courante (DB + XP) et retourne le verdict. */
  answerCurrent(selected: string[]): AnswerRecord;
  /** Passe à la question suivante, ou clôt la tentative si c'était la dernière. */
  goNext(): void;
  reset(): void;
};

export const useQuizSession = create<QuizSessionState>((set, get) => ({
  packId: null,
  attemptId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  finished: false,

  start(packId, questions) {
    const attemptId = createAttempt(
      packId,
      'quiz',
      questions.map((q) => q.id),
    );
    set({ packId, attemptId, questions, currentIndex: 0, answers: {}, finished: false });
  },

  answerCurrent(selected) {
    const { questions, currentIndex, attemptId, packId, answers } = get();
    const question = questions[currentIndex];
    const record: AnswerRecord = { selected, isCorrect: isAnswerCorrect(question, selected) };
    if (attemptId && packId) {
      recordAnswer(attemptId, question.id, selected, record.isCorrect);
      bumpQuestionStat(packId, question.id, record.isCorrect);
      if (record.isCorrect) addDailyXp(XP.correctAnswer);
    }
    set({ answers: { ...answers, [question.id]: record } });
    return record;
  },

  goNext() {
    const { currentIndex, questions, attemptId, answers } = get();
    if (currentIndex + 1 < questions.length) {
      set({ currentIndex: currentIndex + 1 });
      return;
    }
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    if (attemptId) finishAttempt(attemptId, scorePct(correctCount, questions.length));
    set({ finished: true });
  },

  reset() {
    set({
      packId: null,
      attemptId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      finished: false,
    });
  },
}));
