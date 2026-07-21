import { Easing } from 'react-native';

/**
 * Direction de motion (section 05 de la refonte).
 *
 * Règle d'or : **sobre par défaut, généreux aux moments qui comptent**. On anime
 * le feedback et les récompenses (là où le cerveau attend une réponse), on reste
 * discret sur la navigation courante. Objectif : gratifiant, jamais fatigant.
 */
export const Duration = {
  /** Micro — appui, bascule. */
  micro: 120,
  /** UI — transitions, apparitions. */
  ui: 220,
  /** Célébration — rang, série, XP. */
  celebration: 480,
} as const;

export const Motion = {
  /** Courbe standard : l'immense majorité des mouvements. */
  standard: Easing.bezier(0.2, 0.8, 0.2, 1),
  /** Récompenses : léger dépassement (~1.08) avant de se poser. */
  reward: Easing.out(Easing.back(1.6)),
  /** Uniquement flamme, curseur, chargement en boucle. */
  loop: Easing.linear,
} as const;

/** Échelle du dépassement des récompenses (pop-in). */
export const RewardOvershoot = 1.08;
