/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Direction « terminal élégant » : encre bleutée profonde, accent menthe
// terminal, surfaces bordées (pas de blocs flottants), monospace pour la
// donnée (codes, scores, chrono). Sombre d'abord, clair soigné.
export const Colors = {
  light: {
    text: '#0B1626',
    background: '#F5F8FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E9EFF8',
    border: '#DFE7F2',
    textSecondary: '#5B6B80',
    accent: '#0BA97C',
    accentSoft: '#D9F7EC',
    accentDark: '#088562',
    onAccent: '#FFFFFF',
    success: '#17A35C',
    successSoft: '#DCF7E7',
    danger: '#E2474C',
    dangerSoft: '#FCE5E6',
    dangerDark: '#B8363B',
    streak: '#D98315',
    streakSoft: '#FCEFDA',
  },
  /** Palette de la refonte (dark first) — « encre bleutée » + menthe phosphore. */
  dark: {
    text: '#EAF0FB',
    background: '#0A0F1C',
    backgroundElement: '#121A2E',
    backgroundSelected: '#1A2440',
    border: '#29344F',
    textSecondary: '#8695AE',
    accent: '#2DE0A6',
    accentSoft: '#0E2A2C',
    accentDark: '#17A87A',
    onAccent: '#05231A',
    success: '#59E38B',
    successSoft: '#10321F',
    danger: '#FF6B6B',
    dangerSoft: '#3A1B1F',
    dangerDark: '#C9494C',
    streak: '#FFB23E',
    streakSoft: '#33270D',
  },
} as const;

/**
 * Teintes secondaires (une par domaine/section) : la variété de couleur
 * intentionnelle est ce qui distingue une vraie identité d'un thème
 * mono-accent générique. Cycle stable par index.
 */
export const Hues = {
  light: [
    { base: '#0BA97C', soft: '#D9F7EC' }, // menthe
    { base: '#6D4DE6', soft: '#EAE4FC' }, // violet
    { base: '#D98315', soft: '#FCEFDA' }, // ambre
    { base: '#2E7CE6', soft: '#E1EDFC' }, // bleu
    { base: '#DB2777', soft: '#FBE3EF' }, // rose
  ],
  /** Cycle de la refonte : menthe → violet → ambre → bleu → rose. */
  dark: [
    { base: '#2DE0A6', soft: '#0E2A2C' },
    { base: '#A98BFA', soft: '#231D3E' },
    { base: '#FFB23E', soft: '#33270D' },
    { base: '#5AA7F5', soft: '#12233D' },
    { base: '#F472B6', soft: '#3A1229' },
  ],
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Deux familles, embarquées dans le binaire (plugin expo-font) et référencées
 * par leur nom PostScript — c'est ce qu'iOS attend. Space Grotesk porte l'UI et
 * les titres (géométrique, du caractère) ; JetBrains Mono porte la DONNÉE
 * (codes, XP, chrono, rangs, commandes). Ce contraste est la signature typo.
 */
export const FontFamily = {
  regular: 'SpaceGrotesk-Regular',
  medium: 'SpaceGrotesk-Medium',
  semibold: 'SpaceGrotesk-SemiBold',
  bold: 'SpaceGrotesk-Bold',
  mono: 'JetBrainsMono-Regular',
  monoBold: 'JetBrainsMono-Bold',
} as const;

export const Fonts = {
  sans: FontFamily.regular,
  serif: Platform.select({ ios: 'ui-serif', default: 'serif' }),
  rounded: FontFamily.regular,
  mono: FontFamily.mono,
};

/**
 * Rayons de la refonte. Bordures d'abord, ombres rares : une surface se
 * distingue par son trait, pas par une ombre portée.
 */
export const Radius = {
  small: 8,
  medium: 16,
  large: 20,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
