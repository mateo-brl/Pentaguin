import * as Haptics from 'expo-haptics';

/**
 * Retours haptiques centralisés. `expo-haptics` fait déjà partie du binaire ;
 * chaque appel est protégé pour rester un no-op silencieux là où l'haptique
 * n'est pas disponible (simulateur, réglage système désactivé).
 */

/** Tap léger sur une pression de bouton. */
export function tapFeedback(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Succès (bonne réponse, action réussie). */
export function successFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Erreur (mauvaise réponse, échec). */
export function errorFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
