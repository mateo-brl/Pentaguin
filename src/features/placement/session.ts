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
      Array.isArray(parsed.levels) && // état d'une ancienne version du moteur → on repart de zéro
      parsed.step < PLACEMENT_TOTAL // état hérité d'un test plus LONG (30 q.) : déjà « fini » → à finaliser, pas à reprendre
    ) {
      return parsed;
    }
  } catch {
    // état corrompu : on repart de zéro
  }
  // État inutilisable (corrompu, hérité, déjà « fini ») : on le purge pour ne
  // pas retomber dessus à chaque lancement (cause du soft-lock 30→20).
  setKv(STATE_KEY, '');
  return null;
}

/** Clôt le test : pose le rang, purge l'état de reprise. */
function finalize(state: PlacementState) {
  const rank = finalRank(state);
  setRank(rank);
  setKv(STATE_KEY, '');
  return rank;
}

type PlacementSession = {
  state: PlacementState;
  current: PlacementQuestion | null;
  finished: boolean;
  resultRank: number | null;
  total: number;
  /** Reprend un test en cours si présent, sinon en démarre un neuf. */
  start(): void;
  /** Enregistre la réponse (avec l'id de la question, garde anti-double-tap). */
  answer(questionId: string, correct: boolean): void;
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
    // Garde-fous : état déjà fini (défense), ou banque trop petite pour la
    // prochaine question → on clôt proprement plutôt que de rester coincé.
    const q = isPlacementDone(state) ? null : nextQuestion(bank, state);
    if (isPlacementDone(state) || (q == null && state.step > 0)) {
      set({ state, current: null, finished: true, resultRank: finalize(state) });
      return;
    }
    set({ state, current: q, finished: false, resultRank: null });
  },

  answer(questionId, correct) {
    const { state, current } = get();
    // Anti-double-tap : la réponse doit viser la question AFFICHÉE. Un 2e tap
    // (props périmées) porte l'ancien id → ignoré, sinon il fausserait le rang.
    if (!current || current.id !== questionId) return;
    const bank = getPlacementQuestions();
    const next = applyAnswer(state, current, correct);
    const q = isPlacementDone(next) ? null : nextQuestion(bank, next);
    if (isPlacementDone(next) || q == null) {
      set({ state: next, current: null, finished: true, resultRank: finalize(next) });
    } else {
      setKv(STATE_KEY, JSON.stringify(next));
      set({ state: next, current: q, finished: false });
    }
  },

  reset() {
    setKv(STATE_KEY, '');
    set({ state: initPlacement(), current: null, finished: false, resultRank: null });
  },
}));
