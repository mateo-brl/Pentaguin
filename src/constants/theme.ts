/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#FFFFFF',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#52606D',
    accent: '#0369A1',
    accentSoft: '#E0F2FE',
    onAccent: '#FFFFFF',
    success: '#15803D',
    successSoft: '#DCFCE7',
    danger: '#B91C1C',
    dangerSoft: '#FEE2E2',
    streak: '#C2410C',
    streakSoft: '#FFEDD5',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0B1120',
    backgroundElement: '#161F31',
    backgroundSelected: '#22304A',
    textSecondary: '#94A3B8',
    accent: '#38BDF8',
    accentSoft: '#0F2A44',
    onAccent: '#062033',
    success: '#4ADE80',
    successSoft: '#123B26',
    danger: '#F87171',
    dangerSoft: '#3F1B1B',
    streak: '#FB923C',
    streakSoft: '#3B2416',
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
