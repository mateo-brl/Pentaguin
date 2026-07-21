import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RankBadge } from '@/components/ui/rank-badge';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { DEFAULT_PACK_ID, getDefaultPack, lessonsByDomain } from '@/content';
import { getCompletedLessonIds, getTotalXp } from '@/db/repositories';
import { parseAvatar } from '@/features/account/avatar';
import { useSession } from '@/features/account/session';
import { usePlacementSession } from '@/features/placement/session';
import { useRank } from '@/features/rank/ranks';
import { useStreak } from '@/features/gamification/use-streak';
import { getPseudo } from '@/features/leaderboard/identity';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function ProfileScreen() {
  const pack = getDefaultPack();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const { me } = useSession();
  const rank = useRank();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const { longest } = useStreak();

  const [totalXp, setTotalXp] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      setTotalXp(getTotalXp());
      setCompleted(getCompletedLessonIds(DEFAULT_PACK_ID));
    }, []),
  );

  const pseudo = me?.pseudo ?? getPseudo() ?? '';
  const avatar = parseAvatar(me?.avatar, pseudo);
  const identity =
    me?.email ??
    (me?.providers.includes('apple')
      ? t.account.appleAccount
      : me?.providers.includes('google')
        ? t.account.googleAccount
        : t.account.emailAccount);

  const links = [
    {
      key: 'ranks',
      icon: 'trending-up' as const,
      title: t.ranksScreen.title,
      href: '/ranks' as const,
      hue: hueFor(2),
    },
    {
      key: 'leaderboard',
      icon: 'podium' as const,
      title: t.profile.leaderboard,
      href: '/leaderboard' as const,
      hue: hueFor(3),
    },
    {
      key: 'account',
      icon: 'person' as const,
      title: t.profile.account,
      href: '/account' as const,
      hue: hueFor(1),
    },
    {
      key: 'security',
      icon: 'lock-closed' as const,
      title: t.profile.security,
      href: '/security' as const,
      hue: hueFor(0),
    },
    {
      key: 'settings',
      icon: 'settings-outline' as const,
      title: t.settings.title,
      href: '/settings' as const,
      hue: hueFor(2),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* En-tête identité, tactile → écran Compte */}
          <RowGroup style={styles.heroGroup}>
            <Row
              first
              onPress={() => router.push('/account')}
              leading={<Avatar spec={avatar} pseudo={pseudo} size={56} />}
              title={pseudo}
              subtitle={identity}
              trailing={rank != null ? <RankBadge rankId={rank} compact /> : undefined}
            />
          </RowGroup>

          <View style={styles.statsRow}>
            <View style={[styles.statTile, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="stat" themeColor="accent" style={styles.statValue}>
                {totalXp}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="accent">
                {t.profile.xpTotal}
              </ThemedText>
            </View>
            <View style={[styles.statTile, { backgroundColor: theme.streakSoft }]}>
              <ThemedText type="stat" themeColor="streak" style={styles.statValue}>
                {longest}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="streak">
                {t.profile.bestStreak}
              </ThemedText>
            </View>
          </View>

          {domains.length > 0 && (
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            {t.profile.progress}
          </ThemedText>
          )}
          {domains.length > 0 && (
          <RowGroup>
            {domains.map((domain, index) => {
              const hue = hueFor(index);
              const lessons = lessonsByDomain(pack, domain.id);
              const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
              return (
                <View
                  key={domain.id}
                  style={[
                    styles.progressRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.border,
                    },
                  ]}>
                  <SquareBadge color={hue.base} background={hue.soft}>
                    {domain.code}
                  </SquareBadge>
                  <View style={styles.progressBody}>
                    <View style={styles.progressHeader}>
                      <ThemedText type="small" numberOfLines={1} style={styles.progressTitle}>
                        {domain.title}
                      </ThemedText>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        {done}/{lessons.length}
                      </ThemedText>
                    </View>
                    <ProgressBar
                      value={lessons.length > 0 ? done / lessons.length : 0}
                      color={hue.base}
                      height={8}
                    />
                  </View>
                </View>
              );
            })}
          </RowGroup>
          )}

          <RowGroup style={styles.linksGroup}>
            {links.map((item, index) => (
              <Row
                key={item.key}
                first={index === 0}
                title={item.title}
                leading={
                  <SquareBadge color={item.hue.base} background={item.hue.soft}>
                    <Ionicons name={item.icon} size={19} color={item.hue.base} />
                  </SquareBadge>
                }
                onPress={() => router.push(item.href)}
              />
            ))}
          </RowGroup>

          {rank != null && (
            <RowGroup style={styles.linksGroup}>
              <Row
                first
                title={t.placement.retake}
                leading={
                  <SquareBadge color={hueFor(2).base} background={hueFor(2).soft}>
                    <Ionicons name="medal" size={19} color={hueFor(2).base} />
                  </SquareBadge>
                }
                onPress={() => {
                  usePlacementSession.getState().reset();
                  router.push('/placement');
                }}
              />
            </RowGroup>
          )}

          <ThemedView style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.profile.version} {version}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
              {t.profile.disclaimer}
            </ThemedText>
          </ThemedView>
        </ScrollView>
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
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  heroGroup: {
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 15,
    marginTop: Spacing.one,
    marginBottom: -Spacing.one,
  },
  linksGroup: {
    marginTop: Spacing.one,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  progressBody: {
    flex: 1,
    gap: 7,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  progressTitle: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 36,
    lineHeight: 42,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.one,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
