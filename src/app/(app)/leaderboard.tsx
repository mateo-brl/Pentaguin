import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { rankLabel } from '@/components/ui/rank-badge';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { Spacing } from '@/theme';
import { parseAvatar } from '@/features/account/avatar';
import { getRank } from '@/features/rank/ranks';
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
import {
  blockPseudo,
  filterBlocked,
  getBlockedPseudos,
  reportAndBlock,
  unblockAll,
} from '@/features/leaderboard/moderation';
import { useToast } from '@/features/toast/toast';
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
  const [retry, setRetry] = useState(0);
  const [blocked, setBlocked] = useState<string[]>(() => getBlockedPseudos());
  const toast = useToast();

  // Le classement est la seule surface où l'on voit du contenu écrit par
  // d'autres (leur pseudo). La guideline 1.2 d'Apple demande de pouvoir le
  // signaler ET d'en bloquer l'auteur : le masquage est local et immédiat, le
  // signalement part au serveur.
  const visible = useMemo(
    () => (entries === null ? null : filterBlocked(entries, blocked)),
    [entries, blocked],
  );

  const moderate = (target: string) => {
    Alert.alert(t.leaderboard.moderationTitle, t.leaderboard.moderationBody, [
      { text: t.account.cancel, style: 'cancel' },
      {
        text: t.leaderboard.block,
        onPress: () => {
          blockPseudo(target);
          setBlocked(getBlockedPseudos());
          toast.show(t.leaderboard.blocked, 'success');
        },
      },
      {
        text: t.leaderboard.report,
        style: 'destructive',
        onPress: async () => {
          try {
            await reportAndBlock(target, await getToken());
            toast.show(t.leaderboard.reported, 'success');
          } catch {
            // Le masquage local a déjà eu lieu : on ne laisse pas l'échec
            // réseau remettre le contenu offensant sous les yeux.
            toast.show(t.leaderboard.reportFailed, 'error');
          }
          setBlocked(getBlockedPseudos());
        },
      },
    ]);
  };

  useEffect(() => {
    if (!pseudo) return;
    let cancelled = false;
    (async () => {
      // Repart d'un état de chargement : sinon l'ancienne liste reste affichée
      // au changement de période (ou lors d'un réessai).
      setEntries(null);
      setError(false);
      try {
        const token = await getToken();
        await syncActivity(
          buildSyncPayload(getDeviceId(), pseudo, getDailyActivity(), getRank()),
          token,
        );
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
  }, [pseudo, period, retry]);

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
            <View style={styles.errorBox}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                {t.leaderboard.error}
              </ThemedText>
              <Button label={t.common.retry} variant="secondary" onPress={() => setRetry((r) => r + 1)} />
            </View>
          ) : visible === null ? (
            <ActivityIndicator style={styles.loading} color={theme.accent} />
          ) : visible.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {t.leaderboard.empty}
            </ThemedText>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <RowGroup>
                {(visible ?? []).map((item, index) => {
                  const isSelf = item.pseudo === pseudo;
                  const podium = item.rank <= 3;
                  return (
                    <Row
                      key={`${item.rank}-${item.pseudo}`}
                      first={index === 0}
                      title={`${item.pseudo}${isSelf ? ` (${t.leaderboard.you})` : ''}`}
                      subtitle={Number.isInteger(item.rankId) ? rankLabel(item.rankId as number, t) : undefined}
                      leading={
                        <View style={styles.rank}>
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
                          <Avatar spec={parseAvatar(item.avatar, item.pseudo)} pseudo={item.pseudo} size={34} />
                        </View>
                      }
                      trailing={
                        <View style={styles.trailing}>
                          <ThemedText type="smallBold" themeColor="accent">
                            {item.xp} {t.leaderboard.points}
                          </ThemedText>
                          {!isSelf && (
                            <Pressable
                              onPress={() => moderate(item.pseudo)}
                              hitSlop={12}
                              accessibilityRole="button"
                              accessibilityLabel={t.leaderboard.moderationTitle}
                              style={({ pressed }) => pressed && styles.pressed}>
                              <Ionicons
                                name="ellipsis-horizontal"
                                size={18}
                                color={theme.textSecondary}
                              />
                            </Pressable>
                          )}
                        </View>
                      }
                    />
                  );
                })}
              </RowGroup>
              {blocked.length > 0 && (
                <View style={styles.blockedBox}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.leaderboard.hiddenCount.replace('{n}', String(blocked.length))}
                  </ThemedText>
                  <Button
                    label={t.leaderboard.unblockAll}
                    variant="ghost"
                    onPress={() => {
                      unblockAll();
                      setBlocked([]);
                    }}
                  />
                </View>
              )}
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
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.5,
  },
  blockedBox: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.base,
  },
  optIn: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  periods: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  errorBox: { alignItems: 'center', gap: Spacing.base, padding: Spacing.lg },
  message: {
    padding: Spacing.lg,
    textAlign: 'center',
  },
  loading: {
    padding: Spacing.xl,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

