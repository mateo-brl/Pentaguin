import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
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
            <ScrollView contentContainerStyle={styles.list}>
              <RowGroup>
                {(entries ?? []).map((item, index) => {
                  const isSelf = item.pseudo === pseudo;
                  const podium = item.rank <= 3;
                  return (
                    <Row
                      key={item.rank}
                      first={index === 0}
                      title={`${item.pseudo}${isSelf ? ` (${t.leaderboard.you})` : ''}`}
                      leading={
                        <SquareBadge
                          color={
                            isSelf ? theme.accent : podium ? theme.streak : theme.textSecondary
                          }
                          background={
                            isSelf
                              ? theme.accentSoft
                              : podium
                                ? theme.streakSoft
                                : theme.backgroundSelected
                          }>
                          {String(item.rank)}
                        </SquareBadge>
                      }
                      trailing={
                        <ThemedText type="smallBold" themeColor="accent">
                          {item.xp} {t.leaderboard.points}
                        </ThemedText>
                      }
                    />
                  );
                })}
              </RowGroup>
            </ScrollView>
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
  },
});
