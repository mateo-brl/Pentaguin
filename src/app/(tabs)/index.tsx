import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { getKv, localDateKey } from '@/db/repositories';
import { DAILY_CHALLENGE_KV_KEY, dailyChallengeQuestions } from '@/features/gamification/daily-challenge';
import { mascotEmoji } from '@/features/gamification/mascot';
import { useStreak } from '@/features/gamification/use-streak';
import { useEntitlements } from '@/features/monetization';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function HomeScreen() {
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const { current, longest, activeToday } = useStreak();

  const [challengeDoneDate, setChallengeDoneDate] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setChallengeDoneDate(getKv(DAILY_CHALLENGE_KV_KEY));
    }, []),
  );

  const today = localDateKey();
  const challengeDone = challengeDoneDate === today;

  const startChallenge = () => {
    const questions = dailyChallengeQuestions(pack, entitlements, today);
    if (questions.length === 0) return;
    useQuizSession.getState().start(pack.id, questions, { challengeDate: today });
    router.push('/quiz/play');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <Text style={styles.mascot}>{mascotEmoji(current, activeToday)}</Text>
          <ThemedText type="title">Pentaguin</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            {t.home.tagline}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.streakRow}>
            <ThemedText type="smallBold" themeColor="streak">
              🔥 {t.home.streakLabel}
            </ThemedText>
            {longest > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.streakRecord} : {longest}
              </ThemedText>
            )}
          </View>
          <ThemedText type="subtitle">
            {current} {t.home.days}
          </ThemedText>
        </ThemedView>

        <Link href="/learn" asChild>
          <Pressable style={[styles.cta, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {t.home.continueCta}
            </ThemedText>
          </Pressable>
        </Link>

        <Pressable disabled={challengeDone} onPress={startChallenge}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={challengeDone && { color: theme.success }}>
              {challengeDone ? t.home.challengeDone : `⚡ ${t.home.dailyChallenge}`}
            </ThemedText>
            {!challengeDone && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.challengeDesc}
              </ThemedText>
            )}
          </ThemedView>
        </Pressable>
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
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.two,
  },
  mascot: {
    fontSize: 72,
  },
  tagline: {
    textAlign: 'center',
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cta: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
