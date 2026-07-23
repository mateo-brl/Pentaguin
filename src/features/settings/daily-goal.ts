import { useSyncExternalStore } from 'react';

import { getKv, setKv } from '@/db/repositories';
import { GOAL_XP, type GoalLevel } from '@/features/gamification/retention';

const KEY = 'daily_goal_level';
let current: GoalLevel = 'normal';
const listeners = new Set<() => void>();

/** À appeler une fois au démarrage (lecture du choix persistant). */
export function initDailyGoal(): void {
  const stored = getKv(KEY);
  if (stored === 'light' || stored === 'normal' || stored === 'intense') current = stored;
}

export function getDailyGoalLevel(): GoalLevel {
  return current;
}

/** XP cible correspondant au niveau choisi. */
export function getDailyGoalXp(): number {
  return GOAL_XP[current];
}

export function setDailyGoalLevel(level: GoalLevel): void {
  current = level;
  setKv(KEY, level);
  listeners.forEach((notify) => notify());
}

export function useDailyGoalLevel(): GoalLevel {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
    () => current,
  );
}
