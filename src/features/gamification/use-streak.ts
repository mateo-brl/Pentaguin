import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getActivityDates, localDateKey } from '@/db/repositories';

import { computeStreak } from './streak';

/** Streak courant/record + activité du jour, rafraîchi à chaque focus d'écran. */
export function useStreak() {
  const [dates, setDates] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setDates(getActivityDates());
    }, []),
  );

  const today = localDateKey();
  const { current, longest } = computeStreak(dates, today);
  return { current, longest, activeToday: dates.includes(today) };
}
