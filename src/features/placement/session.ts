import { create } from 'zustand';

import { getPlacementQuestions, type PlacementQuestion } from '@/content/placement';
import { getKv, setKv } from '@/db/repositories';
import { setRank } from '@/features/rank/ranks';

import {
  applyAnswer,
  finalRank,
  initPlacement,
  isPlacementDone,
  nextQuestion,
  PLACEMENT_TOTAL,
  type PlacementState,
} from './engine';

const STATE_KEY = 'placement_state';

function loadState(): PlacementState | null {
  const raw = getKv(STATE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlacementState;
    if (
      parsed &&
      typeof parsed.currentLevel === 'number' &&
      typeof parsed.step === 'number' &&
      Array.isArray(parsed.askedIds) &&
      Array.isArray(parsed.levels) // état d'une ancienne version du moteur → on repart de zéro
    ) {
      return parsed;
    }
  } catch {
    // état corrompu : on repart de zéro
  }
  return null;
}

type PlacementSession = {
  state: PlacementState;
  current: PlacementQuestion | null;
  finished: boolean;
  resultRank: number | null;
  total: number;
  /** Reprend un test en cours si présent, sinon en démarre un neuf. */
  start(): void;
  /** Enregistre la réponse ; à la fin, pose le rang. */
  answer(correct: boolean): void;
  /** Efface l'état de reprise (pour re-passer le test). Ne touche pas au rang. */
  reset(): void;
};

export const usePlacementSession = create<PlacementSession>((set, get) => ({
  state: initPlacement(),
  current: null,
  finished: false,
  resultRank: null,
  total: PLACEMENT_TOTAL,

  start() {
    const bank = getPlacementQuestions();
    const state = loadState() ?? initPlacement();
    if (isPlacementDone(state)) {
      set({ state, current: null, finished: true, resultRank: finalRank(state) });
      return;
    }
    set({ state, current: nextQuestion(bank, state), finished: false, resultRank: null });
  },

  answer(correct) {
    const { state, current } = get();
    if (!current) return;
    const bank = getPlacementQuestions();
    const next = applyAnswer(state, current, correct);
    if (isPlacementDone(next)) {
      const rank = finalRank(next);
      setRank(rank);
      setKv(STATE_KEY, ''); // test terminé : plus besoin de l'état de reprise
      set({ state: next, current: null, finished: true, resultRank: rank });
    } else {
      setKv(STATE_KEY, JSON.stringify(next));
      set({ state: next, current: nextQuestion(bank, next), finished: false });
    }
  },

  reset() {
    setKv(STATE_KEY, '');
    set({ state: initPlacement(), current: null, finished: false, resultRank: null });
  },
}));
