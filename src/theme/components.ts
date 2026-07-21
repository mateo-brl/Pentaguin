import { Platform } from 'react-native';

import { radius, space, stroke } from './primitives';

/**
 * NIVEAU 3 — TOKENS DE COMPOSANT
 *
 * Les décisions récurrentes, nommées une fois. Un composant qui a besoin d'une
 * mesure la prend ici ; s'il n'y en a pas, on en ajoute une plutôt que d'écrire
 * un nombre à la main.
 */

/** Bouton « tranche » : la face repose sur une tranche pleine qui s'enfonce. */
export const button = {
  faceHeight: 52,
  edgeHeight: 4,
  radius: radius.md,
  paddingX: space.lg,
  ghostHeight: 44,
  borderWidth: stroke.thick,
  disabledOpacity: 0.45,
} as const;

/** Listes : une seule surface bordée + séparateurs fins. */
export const row = {
  radius: radius.md,
  paddingX: space.base,
  paddingY: space.base,
  gap: space.base,
  badgeSize: 44,
  badgeRadius: radius.md,
  dimmedOpacity: 0.55,
} as const;

/** Cartes et tuiles. */
export const card = {
  radius: radius.lg,
  padding: space.base,
  gap: space.sm,
  borderWidth: stroke.hair,
} as const;

/** Pastilles (chips, pilules d'état). */
export const chip = {
  radius: radius.pill,
  paddingX: space.sm,
  paddingY: space.xs,
} as const;

/** Zone « terminal » des exercices. */
export const terminal = {
  radius: radius.md,
  padding: space.base,
  minHeight: 160,
  fontSize: 12.5,
  lineHeight: 18,
  lineGap: space.xs,
} as const;

/** Barres de progression. */
export const progress = {
  height: 8,
  radius: radius.sm,
} as const;

/** Retrait bas des onglets (zone de la barre système). */
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** Largeur maximale de contenu (tablettes). */
export const MaxContentWidth = 800;
