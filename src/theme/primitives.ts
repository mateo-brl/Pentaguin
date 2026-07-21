/**
 * NIVEAU 1 — PRIMITIVES
 *
 * Valeurs brutes, sans intention d'usage. Rien d'autre dans l'app ne doit
 * importer ce fichier : on passe toujours par les tokens sémantiques.
 *
 * Direction : base « encre » (un presque-noir légèrement désaturé, jamais
 * #000), neutres froids « glacier », UN accent chaud ambre/or tiré de la tache
 * orangée du cou de notre manchot empereur.
 */

export const palette = {
  // — Encre & glacier (neutres froids) ------------------------------------------
  ink900: '#05080F', // fond des surfaces « terminal »
  ink800: '#0A0F1C', // fond d'app
  ink700: '#121A2E', // surface
  ink600: '#1A2440', // surface enfoncée / sélection
  ink500: '#29344F', // bordure
  glacier400: '#6E7C94', // texte désactivé
  glacier300: '#8695AE', // texte secondaire
  glacier200: '#B7C3D8',
  glacier100: '#EAF0FB', // texte principal

  // — Ambre : l'accent de marque, littéralement la couleur du manchot -----------
  amber500: '#FBBE4B', // accent (cou du manchot empereur)
  amber600: '#E0A22F', // état pressé / tranche du bouton
  amber700: '#8A6414', // variante lisible sur fond clair
  amberSoft: '#33270D', // fond teinté sombre
  amberSoftLight: '#FDF1D6', // fond teinté clair
  onAmber: '#1E1503', // texte posé sur l'ambre

  // — Menthe : RÉSERVÉE au succès/validation (plus jamais accent) ---------------
  mint500: '#2DE0A6',
  mint600: '#17A87A',
  mintSoft: '#0B2A20',
  mintSoftLight: '#D9F7EC',

  // — Rouge légèrement désaturé (jamais flashy) --------------------------------
  red500: '#E4655F',
  red600: '#B4453F',
  redSoft: '#33191A',
  redSoftLight: '#FBE6E5',

  // — Orange brûlé : la série (distinct de l'ambre d'action) --------------------
  ember500: '#EF9330',
  emberSoft: '#2E1E0C',
  emberSoftLight: '#FCEBD9',

  // — Clair -------------------------------------------------------------------
  white: '#FFFFFF',
  paper100: '#F5F8FC',
  paper200: '#E9EFF8',
  paper300: '#DFE7F2',
  slate600: '#5B6B80',
  slate900: '#0B1626',
} as const;

/**
 * Échelle d'espacement FIXE. Aucune valeur hors de cette liste ne doit
 * apparaître dans un composant.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/** Quatre rayons, pas un de plus. */
export const radius = {
  sm: 8,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

/** Épaisseurs de trait (les bordures portent l'élévation, pas les ombres). */
export const stroke = {
  hair: 1,
  thick: 2,
} as const;

/** Durées d'animation — cf. la direction de motion. */
export const duration = {
  micro: 120,
  ui: 220,
  celebration: 480,
} as const;
