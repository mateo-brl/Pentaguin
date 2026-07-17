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
    background: '#F6F8FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAF0F7',
    border: '#E3E9F2',
    textSecondary: '#5B6B80',
    accent: '#0F9D8F',
    accentSoft: '#DDF5F1',
    accentDark: '#0B7568',
    onAccent: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    danger: '#E11D48',
    dangerSoft: '#FDE7EB',
    dangerDark: '#B31848',
    streak: '#D97706',
    streakSoft: '#FCEFD8',
  },
  dark: {
    text: '#EAF0FA',
    background: '#0B1220',
    backgroundElement: '#131C2E',
    backgroundSelected: '#1C2940',
    border: '#24334E',
    textSecondary: '#93A1B8',
    accent: '#2DD4BF',
    accentSoft: '#0E2A2C',
    accentDark: '#179C8B',
    onAccent: '#04211D',
    success: '#4ADE80',
    successSoft: '#10321F',
    danger: '#FB7185',
    dangerSoft: '#371824',
    dangerDark: '#D14D66',
    streak: '#FBBF24',
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
    { base: '#0F9D8F', soft: '#DDF5F1' }, // menthe
    { base: '#6D5AE6', soft: '#EAE6FC' }, // violet
    { base: '#D97706', soft: '#FCEFD8' }, // ambre
    { base: '#2E7CE6', soft: '#E1EDFC' }, // bleu
    { base: '#DB2777', soft: '#FBE3EF' }, // rose
  ],
  dark: [
    { base: '#2DD4BF', soft: '#0E2A2C' },
    { base: '#A78BFA', soft: '#231D3E' },
    { base: '#FBBF24', soft: '#33270D' },
    { base: '#60A5FA', soft: '#12233D' },
    { base: '#F472B6', soft: '#3A1229' },
  ],
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

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
