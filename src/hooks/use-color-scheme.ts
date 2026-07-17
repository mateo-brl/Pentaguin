import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemeMode } from '@/features/settings/theme-mode';

/**
 * Schéma de couleurs effectif : suit le système par défaut, mais respecte le
 * choix explicite de l'utilisateur (Réglages → Thème : Système / Clair / Sombre).
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const mode = useThemeMode();
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
