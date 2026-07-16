import * as Notifications from 'expo-notifications';

import { getKv, setKv } from '@/db/repositories';
import { getStrings } from '@/i18n/strings';

const PROMPTED_KEY = 'reminder_prompted';
const REMINDER_HOUR = 19;

/**
 * Propose le rappel quotidien de streak UNE seule fois, après une première
 * session réussie — jamais au lancement de l'app (choix UX assumé). Si refus,
 * on ne redemande pas (réactivable plus tard via les réglages iOS).
 */
export async function maybeProposeStreakReminder(): Promise<void> {
  try {
    if (getKv(PROMPTED_KEY)) return;
    setKv(PROMPTED_KEY, new Date().toISOString());

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const t = getStrings();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.notifications.reminderTitle,
        body: t.notifications.reminderBody,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
  } catch {
    // Notifications indisponibles (simulateur, permission système…) : ne jamais bloquer.
  }
}
