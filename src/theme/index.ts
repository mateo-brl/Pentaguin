/**
 * Source unique de vérité du design system. Trois niveaux :
 *   primitives  → valeurs brutes (jamais importées par un composant)
 *   semantic    → rôles (background, accent, success…) ← ce qu'on utilise
 *   components  → décisions récurrentes par composant
 *
 * Voir docs/DESIGN-SYSTEM.md pour les règles.
 */
import '@/global.css';

import { duration, radius, space, stroke } from './primitives';

export { Colors, Hues, type ThemeColor } from './semantic';
export {
  BottomTabInset,
  button,
  card,
  chip,
  MaxContentWidth,
  progress,
  row,
  terminal,
} from './components';

/** Échelle d'espacement — les seules valeurs autorisées. */
export const Spacing = space;
/** Les quatre rayons du système. */
export const Radius = radius;
export const Stroke = stroke;
export const Duration = duration;

/**
 * Polices. Chargées à l'exécution (expo-font `useFonts`) : elles voyagent donc
 * comme des assets d'EAS Update, ce qui les rend modifiables **en OTA** sans
 * rebuild natif. Les styles nomment la FACE exacte — iOS ignore `fontWeight`
 * avec une police personnalisée et fabriquerait un faux gras.
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
  rounded: FontFamily.regular,
  mono: FontFamily.mono,
};
