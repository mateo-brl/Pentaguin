import { useSyncExternalStore } from 'react';

import { getKv, setKv } from '@/db/repositories';

/**
 * Les 15 rangs Pentaguin, du plus faible (1) au meilleur (15). L'échelle est
 * alignée sur la difficulté du quiz de positionnement : 5 « ligues » (dont 3
 * d'élite uniques). Couleurs figées (OK en thème clair/sombre) — la pastille
 * pose la couleur sur un fond neutre.
 */
export type League =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'emperor';

export type Rank = {
  /** 1..15 */
  id: number;
  league: League;
  /** 'III' | 'II' | 'I', ou null pour les ligues d'élite à un seul rang. */
  tier: string | null;
  color: string;
};

const LEAGUES: { league: League; color: string; tiers: (string | null)[] }[] = [
  { league: 'bronze', color: '#B4713D', tiers: ['III', 'II', 'I'] },
  { league: 'silver', color: '#8E9AAB', tiers: ['III', 'II', 'I'] },
  { league: 'gold', color: '#D4A017', tiers: ['III', 'II', 'I'] },
  { league: 'platinum', color: '#4FB8A8', tiers: ['III', 'II', 'I'] },
  { league: 'diamond', color: '#5AA7F5', tiers: [null] },
  { league: 'master', color: '#A98BFA', tiers: [null] },
  { league: 'emperor', color: '#F0B429', tiers: [null] },
];

export const RANKS: Rank[] = (() => {
  const out: Rank[] = [];
  let id = 1;
  for (const l of LEAGUES) {
    for (const tier of l.tiers) out.push({ id: id++, league: l.league, tier, color: l.color });
  }
  return out;
})();

export const MIN_RANK = 1;
export const MAX_RANK = RANKS.length; // 15

export function clampRank(id: number): number {
  return Math.min(Math.max(Math.round(id), MIN_RANK), MAX_RANK);
}

export function rankById(id: number): Rank {
  return RANKS[clampRank(id) - 1];
}

// — Persistance du rang du joueur --------------------------------------------------

const KEY = 'player_rank';
const listeners = new Set<() => void>();

export function getRank(): number | null {
  const value = getKv(KEY);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? clampRank(parsed) : null;
}

export function setRank(id: number): void {
  setKv(KEY, String(clampRank(id)));
  listeners.forEach((notify) => notify());
}

export function clearRank(): void {
  setKv(KEY, '');
  listeners.forEach((notify) => notify());
}

/** Réactif : la garde Apprendre/S'entraîner et les badges suivent le rang. */
export function useRank(): number | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getRank,
    getRank,
  );
}
