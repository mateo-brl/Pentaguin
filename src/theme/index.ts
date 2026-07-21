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

export { Colors, domainColor, Hues, type ThemeColor } from './semantic';
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
 * Polices — source unique. Aucun composant ne cite une police en dur : on passe
 * toujours par `FontFamily`, donc changer la fonte d'UI se fait ICI en une ligne.
 *
 * UI (titres + texte) : **Hanken Grotesk**, un grotesque humaniste au dessin
 * caractérisé (et pas un tell « template »). Mono technique : **JetBrains Mono**,
 * réservée au faux terminal et aux rares labels « données ».
 *
 * Chargées à l'exécution (`useFonts`) : elles voyagent comme des assets d'EAS
 * Update → modifiables **en OTA** sans rebuild. Les styles nomment la FACE
 * exacte (iOS ignore `fontWeight` avec une police perso et ferait un faux gras).
 */
export const FontFamily = {
  regular: 'HankenGrotesk-Regular',
  medium: 'HankenGrotesk-Medium',
  semibold: 'HankenGrotesk-SemiBold',
  bold: 'HankenGrotesk-Bold',
  mono: 'JetBrainsMono-Regular',
  monoBold: 'JetBrainsMono-Bold',
} as const;

export const Fonts = {
  sans: FontFamily.regular,
  rounded: FontFamily.regular,
  mono: FontFamily.mono,
};
