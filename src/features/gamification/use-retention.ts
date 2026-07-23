import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getActivityDates, getKv, getTodayXp, localDateKey, setKv } from '@/db/repositories';

import {
  applyFreezeProtection,
  dailyGoalProgress,
  isMilestone,
  maybeEarnFreeze,
  streakWithFreezes,
  type FreezeState,
  type GoalProgress,
} from './retention';

const FREEZES_KEY = 'streak_freezes';
const FROZEN_DAYS_KEY = 'streak_frozen_days';
const GOAL_EARNED_KEY = 'streak_goal_earned';
const CELEBRATED_KEY = 'streak_celebrated';

function loadFreezeState(): FreezeState {
  const freezes = Number(getKv(FREEZES_KEY) ?? '0') || 0;
  let frozenDays: string[] = [];
  try {
    const raw = getKv(FROZEN_DAYS_KEY);
    if (raw) frozenDays = JSON.parse(raw);
    if (!Array.isArray(frozenDays)) frozenDays = [];
  } catch {
    frozenDays = [];
  }
  return { freezes, frozenDays };
}

function saveFreezeState(state: FreezeState): void {
  setKv(FREEZES_KEY, String(state.freezes));
  setKv(FROZEN_DAYS_KEY, JSON.stringify(state.frozenDays));
}

export type Retention = {
  current: number;
  longest: number;
  activeToday: boolean;
  freezes: number;
  goal: GoalProgress;
  /** Palier à célébrer MAINTENANT (non nul une seule fois), sinon null. */
  celebrate: number | null;
};

/**
 * Applique les mécaniques de rétention à chaque focus d'écran et renvoie l'état
 * pour l'affichage. Effets de bord (KV) : gagner un bouclier à l'objectif,
 * consommer un bouclier pour protéger la série, mémoriser les paliers célébrés.
 */
export function useRetention(): Retention {
  const [snapshot, setSnapshot] = useState<Retention>({
    current: 0,
    longest: 0,
    activeToday: false,
    freezes: 0,
    goal: dailyGoalProgress(0),
    celebrate: null,
  });

  useFocusEffect(
    useCallback(() => {
      const today = localDateKey();
      const activity = getActivityDates();
      const todayXp = getTodayXp();
      let freeze = loadFreezeState();

      // 1) Objectif atteint → gagne un bouclier (1×/jour, plafonné).
      const earned = maybeEarnFreeze(freeze, today, todayXp, getKv(GOAL_EARNED_KEY));
      if (earned) {
        freeze = earned.state;
        saveFreezeState(freeze);
        setKv(GOAL_EARNED_KEY, earned.lastEarned);
      }

      // 2) Protège une série sur le point de casser (un seul jour raté).
      const protectedState = applyFreezeProtection(activity, freeze, today);
      if (protectedState !== freeze) {
        freeze = protectedState;
        saveFreezeState(freeze);
      }

      // 3) Série effective + détection d'un nouveau palier à célébrer.
      const { current, longest } = streakWithFreezes(activity, freeze.frozenDays, today);
      const celebrated = Number(getKv(CELEBRATED_KEY) ?? '0') || 0;
      let celebrate: number | null = null;
      if (isMilestone(current) && current > celebrated) {
        celebrate = current;
        setKv(CELEBRATED_KEY, String(current));
      }

      setSnapshot({
        current,
        longest,
        activeToday: activity.includes(today),
        freezes: freeze.freezes,
        goal: dailyGoalProgress(todayXp),
        celebrate,
      });
    }, []),
  );

  return snapshot;
}
