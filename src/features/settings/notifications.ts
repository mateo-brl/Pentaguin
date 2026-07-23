import * as Notifications from 'expo-notifications';

import { getKv, setKv } from '@/db/repositories';
import { getStrings } from '@/i18n/strings';

const ENABLED_KEY = 'reminders_enabled';
const REMINDER_HOUR = 19;

export function areRemindersEnabled(): boolean {
  return getKv(ENABLED_KEY) === '1';
}

/** Programme le rappel quotidien de streak à 19 h (idempotent). */
export async function scheduleDailyReminder(): Promise<void> {
  const t = getStrings();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: t.notifications.reminderTitle, body: t.notifications.reminderBody },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: 0,
    },
  });
}

/**
 * Active/désactive le rappel quotidien depuis les Réglages. Retourne l'état réel
 * appliqué (false si la permission système est refusée à l'activation).
 */
export async function setRemindersEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;
      await scheduleDailyReminder();
      setKv(ENABLED_KEY, '1');
      return true;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    setKv(ENABLED_KEY, '');
    return false;
  } catch {
    return areRemindersEnabled();
  }
}

/** Marque le rappel comme actif (utilisé quand il est programmé hors Réglages). */
export function markRemindersEnabled(): void {
  setKv(ENABLED_KEY, '1');
}

const SIGNATURE_KEY = 'reminder_signature';

/**
 * Reprogramme le rappel quotidien avec un message PERSONNALISÉ (conscient de la
 * série et de l'objectif). Silencieux si le rappel est désactivé, et ne
 * reprogramme que si le message a changé (évite un travail inutile à chaque
 * focus d'écran). OTA-compatible : notification locale, aucun serveur push.
 */
export async function refreshDailyReminder({
  streak,
  goalDone,
}: {
  streak: number;
  goalDone: boolean;
}): Promise<void> {
  if (!areRemindersEnabled()) return;
  const t = getStrings();

  let title = t.notifications.reminderTitle;
  let body = t.notifications.reminderBody;
  if (goalDone) {
    title = t.notifications.reminderSafeTitle;
    body = t.notifications.reminderSafeBody;
  } else if (streak > 0) {
    title = t.notifications.reminderStreakTitle;
    body = t.notifications.reminderStreakBody.replace('{days}', String(streak));
  }

  const signature = `${title}|${body}`;
  if (getKv(SIGNATURE_KEY) === signature) return; // message inchangé → rien à faire

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
    setKv(SIGNATURE_KEY, signature);
  } catch {
    // notifications indisponibles : ne jamais bloquer
  }
}
