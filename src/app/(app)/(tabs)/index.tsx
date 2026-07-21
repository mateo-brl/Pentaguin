import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin, StreakFlame } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { rankLabel } from '@/components/ui/rank-badge';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Stroke } from '@/theme';
import { DEFAULT_PACK_ID, getDefaultPack, lessonsByDomain } from '@/content';
import { getCompletedLessonIds, getKv, getTotalXp, localDateKey } from '@/db/repositories';
import { useSession } from '@/features/account/session';
import {
  DAILY_CHALLENGE_KV_KEY,
  dailyChallengeQuestions,
} from '@/features/gamification/daily-challenge';
import { useStreak } from '@/features/gamification/use-streak';
import { getPseudo } from '@/features/leaderboard/identity';
import { isLessonUnlockedNow, useEntitlements } from '@/features/monetization';
import { useQuizSession } from '@/features/quiz/session';
import { recommendedLessons } from '@/features/rank/recommend';
import { useRank } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function HomeScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const rank = useRank();
  const { current } = useStreak();
  const { me } = useSession();

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [challengeDoneDate, setChallengeDoneDate] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setCompleted(getCompletedLessonIds(DEFAULT_PACK_ID));
      setTotalXp(getTotalXp());
      setChallengeDoneDate(getKv(DAILY_CHALLENGE_KV_KEY));
    }, []),
  );

  const today = localDateKey();
  const challengeDone = challengeDoneDate === today;
  const challengeQuestions = dailyChallengeQuestions(pack, entitlements, today);
  const hasChallenge = challengeQuestions.length > 0;

  const pseudo = me?.pseudo ?? getPseudo() ?? '';
  const greeting = pseudo ? t.home.greeting.replace('{name}', pseudo) : t.home.greetingFallback;

  // « Reprendre » : la prochaine leçon de ton rang que tu n'as pas finie.
  const next = rank != null ? recommendedLessons(pack, rank, { exclude: completed, limit: 1 })[0] : undefined;
  const nextDomain = next ? pack.domains.find((d) => d.id === next.domainId) : undefined;
  const domainLessons = nextDomain ? lessonsByDomain(pack, nextDomain.id) : [];
  const doneInDomain = domainLessons.filter((l) => completed.has(l.id)).length;
  const nextUnlocked = next ? isLessonUnlockedNow(next, entitlements) : false;

  const startChallenge = () => {
    if (challengeQuestions.length === 0) return;
    useQuizSession.getState().start(pack.id, challengeQuestions, { challengeDate: today });
    router.push('/quiz/play');
  };


  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Bandeau : signature typographique à gauche, série à droite. */}
          <View style={styles.topBar}>
            <ThemedText type="label" style={styles.wordmark}>
              Pentaguin
            </ThemedText>
            {current > 0 && (
              <View style={styles.streakChip}>
                <StreakFlame size={20} />
                <ThemedText type="mono" style={{ color: theme.streak, fontSize: 15 }}>
                  {current}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Hero : le manchot accueille, le ton est direct et personnel. */}
          <View style={styles.hero}>
            <Penguin state="correct" size={104} animation="float" />
            <View style={styles.heroText}>
              <ThemedText type="title" style={styles.heroTitle}>
                {greeting}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.ready}
              </ThemedText>
            </View>
          </View>

          {/* Reprendre : l'action n°1 de l'écran. */}
          {next && nextDomain && (
            <Pressable
              onPress={() =>
                nextUnlocked
                  ? router.push({ pathname: '/lesson/[id]', params: { id: next.id } })
                  : router.push('/paywall')
              }
              style={({ pressed }) => [
                styles.resumeCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={styles.resumeHead}>
                <ThemedText type="label" style={{ color: theme.accent }}>
                  ▸ {t.home.resume}
                </ThemedText>
                <ThemedText type="label" themeColor="textSecondary">
                  {t.home.step} {Math.min(doneInDomain + 1, domainLessons.length)}/{domainLessons.length}
                </ThemedText>
              </View>
              <ThemedText type="subtitle">{next.title}</ThemedText>
              <ThemedText type="label" themeColor="textSecondary">
                {nextDomain.title} · {next.estMinutes} {t.domain.minutes}
              </ThemedText>
            </Pressable>
          )}

          {/* Hiérarchie assumée : le rang domine (c'est l'identité du joueur),
              XP et série l'accompagnent en second plan. Pas trois cellules clonées. */}
          <View style={styles.statsRow}>
            {/* Contenant neutre (le Défi reste le seul gros foyer ambre) ; on
                garde seulement le texte du rang en ambre comme accent d'identité. */}
            <View
              style={[
                styles.statPrimary,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText type="label" style={{ color: theme.accent }}>
                {t.home.statRank}
              </ThemedText>
              <ThemedText
                type="stat"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.statPrimaryValue, { color: theme.accent }]}>
                {rank != null ? rankLabel(rank, t) : '—'}
              </ThemedText>
            </View>

            <View style={styles.statsSecondary}>
              <View
                style={[
                  styles.statSmall,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText type="label" themeColor="textSecondary">
                  {t.home.statXp}
                </ThemedText>
                <ThemedText type="mono" style={styles.statSmallValue}>
                  {totalXp}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statSmall,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText type="label" themeColor="textSecondary">
                  {t.home.statStreak}
                </ThemedText>
                <ThemedText type="mono" style={[styles.statSmallValue, { color: theme.streak }]}>
                  {current}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Défi du jour : le rendez-vous quotidien. */}
          {hasChallenge && (
            <Pressable
              disabled={challengeDone}
              onPress={startChallenge}
              style={({ pressed }) => [
                styles.challengeTile,
                { backgroundColor: challengeDone ? theme.successSoft : theme.accentSoft },
                pressed && !challengeDone && styles.pressed,
              ]}>
              <View
                style={[
                  styles.challengeIcon,
                  { backgroundColor: challengeDone ? theme.success : theme.accent },
                ]}>
                <Ionicons
                  name={challengeDone ? 'checkmark' : 'flash'}
                  size={20}
                  color={challengeDone ? theme.successSoft : theme.onAccent}
                />
              </View>
              <View style={styles.challengeBody}>
                <ThemedText
                  type="smallBold"
                  style={{ color: challengeDone ? theme.success : theme.accent, fontSize: 15 }}>
                  {challengeDone ? t.home.challengeDone : t.home.dailyChallenge}
                </ThemedText>
                {!challengeDone && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.home.challengeReward}
                  </ThemedText>
                )}
              </View>
              {!challengeDone && (
                <View style={[styles.playPill, { backgroundColor: theme.accent }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                    {t.home.play}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.base,
    gap: Spacing.base,
  },
  topBar: {
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontSize: 13, letterSpacing: 3 },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  heroText: { flex: 1, gap: Spacing.xs },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  resumeCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  resumeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statPrimary: {
    flex: 1.6,
    borderRadius: Radius.lg,
    borderWidth: Stroke.hair,
    padding: Spacing.base,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statPrimaryValue: { fontSize: 26, lineHeight: 32 },
  statsSecondary: { flex: 1, gap: Spacing.sm },
  statSmall: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: Stroke.hair,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statSmallValue: { fontSize: 17 },
  challengeTile: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  challengeIcon: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  challengeBody: { flex: 1, gap: Spacing.xs },
  playPill: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
});
