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
    onAccent: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    danger: '#E11D48',
    dangerSoft: '#FDE7EB',
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
    onAccent: '#04211D',
    success: '#4ADE80',
    successSoft: '#10321F',
    danger: '#FB7185',
    dangerSoft: '#371824',
    streak: '#FBBF24',
    streakSoft: '#33270D',
  },
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
