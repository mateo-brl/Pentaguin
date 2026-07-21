import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StreakFlame } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { RankBadge } from '@/components/ui/rank-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { getKv, localDateKey } from '@/db/repositories';
import { DAILY_CHALLENGE_KV_KEY, dailyChallengeQuestions } from '@/features/gamification/daily-challenge';
import { useStreak } from '@/features/gamification/use-streak';
import { useEntitlements } from '@/features/monetization';
import { useQuizSession } from '@/features/quiz/session';
import { useRank } from '@/features/rank/ranks';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';


export default function HomeScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const entitlements = useEntitlements();
  const rank = useRank();
  const { current, longest } = useStreak();

  const [challengeDoneDate, setChallengeDoneDate] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setChallengeDoneDate(getKv(DAILY_CHALLENGE_KV_KEY));
    }, []),
  );

  const today = localDateKey();
  const challengeDone = challengeDoneDate === today;
  const challengeHue = hueFor(1); // violet
  const challengeQuestions = dailyChallengeQuestions(pack, entitlements, today);
  const hasChallenge = challengeQuestions.length > 0;

  const startChallenge = () => {
    if (challengeQuestions.length === 0) return;
    useQuizSession.getState().start(pack.id, challengeQuestions, { challengeDate: today });
    router.push('/quiz/play');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">Pentaguin</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.home.tagline}
          </ThemedText>
          {rank != null && (
            <View style={styles.rank}>
              <RankBadge rankId={rank} />
            </View>
          )}
        </View>

        {/* Bloc streak : aplat plein, gros chiffre — l'élément central de l'accueil */}
        <View style={[styles.streakTile, { backgroundColor: theme.streakSoft }]}>
          <View style={styles.streakMain}>
            {current > 0 && <StreakFlame size={30} />}
            <ThemedText type="stat" themeColor="streak" style={styles.streakNumber}>
              {current}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="streak" style={styles.streakUnit}>
              {current > 1 ? t.home.days : t.home.day} · {t.home.streakLabel.toLowerCase()}
            </ThemedText>
          </View>
          {longest > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {t.home.streakRecord} · {longest}
            </ThemedText>
          )}
        </View>

        {/* Défi du jour : aplat teinté, tactile. Masqué tant qu'aucune question
            n'est disponible (base sans contenu) pour ne pas offrir un tap mort. */}
        {hasChallenge && (
        <Pressable
          disabled={challengeDone}
          onPress={startChallenge}
          style={({ pressed }) => [
            styles.challengeTile,
            { backgroundColor: challengeDone ? theme.successSoft : challengeHue.soft },
            pressed && !challengeDone && styles.pressed,
          ]}>
          <View
            style={[
              styles.challengeIcon,
              { backgroundColor: challengeDone ? theme.success : challengeHue.base },
            ]}>
            <Ionicons
              name={challengeDone ? 'checkmark' : 'flash'}
              size={20}
              color={challengeDone ? theme.successSoft : challengeHue.soft}
            />
          </View>
          <View style={styles.challengeBody}>
            <ThemedText
              type="smallBold"
              style={{ color: challengeDone ? theme.success : challengeHue.base, fontSize: 15 }}>
              {challengeDone ? t.home.challengeDone : t.home.dailyChallenge}
            </ThemedText>
            {!challengeDone && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.challengeDesc}
              </ThemedText>
            )}
          </View>
          {!challengeDone && (
            <Ionicons name="arrow-forward" size={20} color={challengeHue.base} />
          )}
        </Pressable>
        )}

        <View style={styles.spacer} />

        <Button label={t.home.continueCta} onPress={() => router.navigate('/learn')} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  rank: {
    marginTop: Spacing.two,
  },
  streakTile: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  streakNumber: {
    fontSize: 64,
    lineHeight: 70,
  },
  streakUnit: {
    fontSize: 15,
  },
  challengeTile: {
    borderRadius: 24,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  challengeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBody: {
    flex: 1,
    gap: 2,
  },
  spacer: {
    flex: 1,
  },
});
