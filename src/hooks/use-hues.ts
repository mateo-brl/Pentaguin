import { Hues } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type Hue = { base: string; soft: string };

/** Teintes secondaires du thème courant ; hueFor(i) cycle de façon stable. */
export function useHues() {
  const scheme = useColorScheme();
  const hues = Hues[scheme === 'dark' ? 'dark' : 'light'];
  const hueFor = (index: number): Hue => hues[index % hues.length];
  return { hues, hueFor };
}
