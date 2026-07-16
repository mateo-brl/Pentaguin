import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { getDailyActivity } from '@/db/repositories';
import { getToken } from '@/features/account/token';
import {
  buildSyncPayload,
  fetchLeaderboard,
  syncActivity,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from '@/features/leaderboard/api';
import {
  getDeviceId,
  getPseudo,
  isValidPseudo,
  setPseudo as persistPseudo,
} from '@/features/leaderboard/identity';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/**
 * Classement opt-in : rien ne quitte l'appareil tant que l'utilisateur n'a pas
 * choisi un pseudo et rejoint explicitement. Données partagées : pseudo + XP.
 */
export default function LeaderboardScreen() {
  const t = useStrings();
  const theme = useTheme();

  const [pseudo, setPseudoState] = useState<string | null>(() => getPseudo());
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState(false);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pseudo) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        await syncActivity(buildSyncPayload(getDeviceId(), pseudo, getDailyActivity()), token);
        const data = await fetchLeaderboard(period);
        if (!cancelled) {
          setEntries(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pseudo, period]);

  const join = () => {
    if (!isValidPseudo(input)) {
      setInputError(true);
      return;
    }
    persistPseudo(input);
    setInputError(false);
    setPseudoState(input.trim());
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.leaderboard.title }} />

      {!pseudo ? (
        <View style={styles.optIn}>
          <ThemedText type="subtitle">{t.leaderboard.optInTitle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.leaderboard.optInBody}
          </ThemedText>
          <Input
            value={input}
            onChangeText={setInput}
            placeholder={t.leaderboard.pseudoPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            invalid={inputError}
          />
          {inputError && (
            <ThemedText type="small" themeColor="danger">
              {t.leaderboard.invalidPseudo}
            </ThemedText>
          )}
          <Button label={t.leaderboard.join} onPress={join} />
        </View>
      ) : (
        <>
          <View style={styles.periods}>
            {(['all', '7d'] as const).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? t.leaderboard.periodAll : t.leaderboard.period7d}
                selected={period === value}
                onPress={() => setPeriod(value)}
              />
            ))}
          </View>

          {error ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {t.leaderboard.error}
            </ThemedText>
          ) : entries && entries.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {t.leaderboard.empty}
            </ThemedText>
          ) : (
            <FlatList
              data={entries ?? []}
              keyExtractor={(entry) => String(entry.rank)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelf = item.pseudo === pseudo;
                return (
                  <Card selected={isSelf} style={styles.row}>
                    <ThemedText
                      type="mono"
                      style={[styles.rank, { color: isSelf ? theme.accent : theme.textSecondary }]}>
                      {item.rank}
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.pseudo}>
                      {item.pseudo}
                      {isSelf ? ` (${t.leaderboard.you})` : ''}
                    </ThemedText>
                    <ThemedText type="mono" themeColor="accent" style={styles.xp}>
                      {item.xp} {t.leaderboard.points}
                    </ThemedText>
                  </Card>
                );
              }}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  optIn: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  periods: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.four,
    paddingBottom: Spacing.two,
  },
  message: {
    padding: Spacing.four,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
  },
  rank: {
    fontSize: 13,
    minWidth: 26,
  },
  pseudo: {
    flex: 1,
  },
  xp: {
    fontSize: 13,
  },
});
