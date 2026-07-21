import { palette } from './primitives';

/**
 * NIVEAU 2 — TOKENS SÉMANTIQUES
 *
 * Décrivent un RÔLE, jamais une couleur. Les composants n'utilisent que ceci.
 *
 * Règle de cohabitation ambre / menthe : l'**ambre** est la couleur de la marque
 * et de l'ACTION (boutons, liens, mise en avant) ; la **menthe** ne parle que de
 * RÉUSSITE (bonne réponse, confirmation). Les deux ne se croisent jamais dans le
 * même rôle, donc jamais de compétition visuelle.
 */
export const Colors = {
  dark: {
    background: palette.ink800,
    backgroundElement: palette.ink700,
    backgroundSelected: palette.ink600,
    backgroundTerminal: palette.ink900,
    border: palette.ink500,

    text: palette.glacier100,
    textSecondary: palette.glacier300,
    textDisabled: palette.glacier400,

    accent: palette.amber500,
    accentSoft: palette.amberSoft,
    accentDark: palette.amber600,
    onAccent: palette.onAmber,

    success: palette.mint500,
    successSoft: palette.mintSoft,
    successDark: palette.mint600,

    danger: palette.red500,
    dangerSoft: palette.redSoft,
    dangerDark: palette.red600,

    streak: palette.ember500,
    streakSoft: palette.emberSoft,

    /** Ombres : rares et discrètes (les bordures portent l'élévation). */
    shadow: palette.ink900,
  },
  light: {
    background: palette.paper100,
    backgroundElement: palette.white,
    backgroundSelected: palette.paper200,
    backgroundTerminal: palette.ink800,
    border: palette.paper300,

    text: palette.slate900,
    textSecondary: palette.slate600,
    textDisabled: palette.slate600,

    accent: palette.amber700,
    accentSoft: palette.amberSoftLight,
    accentDark: palette.amber600,
    onAccent: palette.white,

    success: palette.mint600,
    successSoft: palette.mintSoftLight,
    successDark: palette.mint600,

    danger: palette.red600,
    dangerSoft: palette.redSoftLight,
    dangerDark: palette.red600,

    streak: palette.ember500,
    streakSoft: palette.emberSoftLight,

    shadow: palette.slate900,
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark & keyof typeof Colors.light;

/**
 * Petites teintes décoratives (usages ponctuels : avatars). Volontairement
 * restreintes, sans violet. Pour les 8 DOMAINES, on n'utilise PAS ceci mais la
 * rampe cohérente `domainColor` ci-dessous.
 */
export const Hues = {
  dark: [
    { base: '#5AA7F5', soft: '#12233D' },
    { base: '#7FC8E8', soft: '#102733' },
    { base: '#E08A3C', soft: '#2E1E0C' },
    { base: '#8E9AAB', soft: '#1A2233' },
    { base: '#D98C9A', soft: '#301A20' },
  ],
  light: [
    { base: '#2E7CE6', soft: '#E1EDFC' },
    { base: '#2A8FB5', soft: '#DDF0F7' },
    { base: '#C2701F', soft: '#FBEBD9' },
    { base: '#5B6B80', soft: '#E7EBF1' },
    { base: '#C05F72', soft: '#FAE4E8' },
  ],
} as const;

/**
 * Rampe des 8 domaines — UNE seule famille froide (bleu → acier glacier),
 * dégradé maîtrisé, jamais un arc-en-ciel. Aucune de ces teintes n'entre en
 * concurrence avec l'accent ambre (action) ni la menthe (succès). Le fond de
 * pastille est la même teinte très diluée : les badges se lisent comme un
 * système, pas comme huit couleurs qui se battent.
 */
const DOMAIN_RAMP = [
  '#4C74AD',
  '#4881AC',
  '#458DAB',
  '#4A98A9',
  '#579FA6',
  '#69A8AE',
  '#7EB1BC',
  '#93BCC9',
] as const;

export function domainColor(index: number): { base: string; soft: string } {
  const base = DOMAIN_RAMP[((index % DOMAIN_RAMP.length) + DOMAIN_RAMP.length) % DOMAIN_RAMP.length];
  return { base, soft: `${base}22` }; // fond = même teinte à ~13 %
}
