import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { getKv, localDateKey } from '@/db/repositories';
import { DAILY_CHALLENGE_KV_KEY, dailyChallengeQuestions } from '@/features/gamification/daily-challenge';
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
  const { current, longest } = useStreak();

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
        <View style={styles.header}>
          <ThemedText type="title">Pentaguin</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.home.tagline}
          </ThemedText>
        </View>

        <Card style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <ThemedText type="label">{t.home.streakLabel}</ThemedText>
            {longest > 0 && (
              <ThemedText type="mono" themeColor="textSecondary" style={styles.record}>
                {t.home.streakRecord} {longest}
              </ThemedText>
            )}
          </View>
          <View style={styles.streakValue}>
            <ThemedText type="stat" themeColor={current > 0 ? 'streak' : 'text'}>
              {current}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.streakUnit}>
              {current > 1 ? t.home.days : t.home.day}
            </ThemedText>
          </View>
        </Card>

        <Card
          onPress={challengeDone ? undefined : startChallenge}
          background={challengeDone ? theme.successSoft : undefined}
          style={styles.challengeCard}>
          <View
            style={[
              styles.challengeIcon,
              { backgroundColor: challengeDone ? 'transparent' : theme.accentSoft },
            ]}>
            <Ionicons
              name={challengeDone ? 'checkmark-circle' : 'flash-outline'}
              size={22}
              color={challengeDone ? theme.success : theme.accent}
            />
          </View>
          <View style={styles.challengeBody}>
            <ThemedText type="smallBold" style={challengeDone && { color: theme.success }}>
              {challengeDone ? t.home.challengeDone : t.home.dailyChallenge}
            </ThemedText>
            {!challengeDone && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.challengeDesc}
              </ThemedText>
            )}
          </View>
          {!challengeDone && (
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          )}
        </Card>

        <View style={styles.spacer} />

        <Link href="/learn" asChild>
          <Pressable style={({ pressed }) => [styles.cta, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent, fontSize: 15 }}>
              {t.home.continueCta}
            </ThemedText>
          </Pressable>
        </Link>
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
  streakCard: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  record: {
    fontSize: 13,
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  streakUnit: {
    marginBottom: 4,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
