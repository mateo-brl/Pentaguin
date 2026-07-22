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

/**
 * Rampe des ligues — SANS violet, alignée sur la palette « encre & glacier ».
 *
 * Lecture voulue : on part de la terre (bronze patiné), on traverse le froid
 * (acier → glacier), et on bascule dans le chaud pour les deux derniers rangs.
 * L'Empereur porte l'or du manchot : le sommet, c'est devenir la mascotte.
 *
 * L'or de la ligue « Or » est volontairement un or ANCIEN, plus sourd que
 * l'ambre d'action (#FBBE4B) : un rang ne doit jamais se lire comme un bouton.
 */
const LEAGUES: { league: League; color: string; tiers: (string | null)[] }[] = [
  { league: 'bronze', color: '#A9713F', tiers: ['III', 'II', 'I'] }, // terre
  { league: 'silver', color: '#8E9AAB', tiers: ['III', 'II', 'I'] }, // acier glacier
  { league: 'gold', color: '#C9962A', tiers: ['III', 'II', 'I'] }, // or ancien
  { league: 'platinum', color: '#5E9FB5', tiers: ['III', 'II', 'I'] }, // bleu acier
  { league: 'diamond', color: '#7FC8E8', tiers: [null] }, // glacier clair — le plus froid
  { league: 'master', color: '#E08A3C', tiers: [null] }, // orange brûlé — bascule
  { league: 'emperor', color: '#F0B429', tiers: [null] }, // l'or du manchot
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
  // Valeur non finie (donnée serveur non typée à l'exécution) → borne basse,
  // sinon Math.round(NaN) = NaN → RANKS[NaN-1] = undefined → crash de l'écran.
  if (!Number.isFinite(id)) return MIN_RANK;
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
