import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
          <ThemedText type="smallBold">{t.leaderboard.optInTitle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.leaderboard.optInBody}
          </ThemedText>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.leaderboard.pseudoPlaceholder}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: inputError ? theme.danger : theme.backgroundElement,
              },
            ]}
          />
          {inputError && (
            <ThemedText type="small" themeColor="danger">
              {t.leaderboard.invalidPseudo}
            </ThemedText>
          )}
          <Pressable onPress={join} style={[styles.join, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {t.leaderboard.join}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.periods}>
            {(['all', '7d'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setPeriod(value)}
                style={[
                  styles.chip,
                  { backgroundColor: period === value ? theme.accent : theme.backgroundElement },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: period === value ? theme.onAccent : theme.text }}>
                  {value === 'all' ? t.leaderboard.periodAll : t.leaderboard.period7d}
                </ThemedText>
              </Pressable>
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
                  <ThemedView
                    type={isSelf ? 'backgroundSelected' : 'backgroundElement'}
                    style={styles.row}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.rank}>
                      {item.rank}
                    </ThemedText>
                    <ThemedText type="small" style={styles.pseudo}>
                      {item.pseudo}
                      {isSelf ? ` (${t.leaderboard.you})` : ''}
                    </ThemedText>
                    <ThemedText type="smallBold" themeColor="accent">
                      {item.xp} {t.leaderboard.points}
                    </ThemedText>
                  </ThemedView>
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
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  join: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  periods: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.four,
    paddingBottom: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  message: {
    padding: Spacing.four,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rank: {
    minWidth: 28,
  },
  pseudo: {
    flex: 1,
  },
});
