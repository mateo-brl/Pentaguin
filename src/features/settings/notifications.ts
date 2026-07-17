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
