import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTotalXp } from '@/db/repositories';
import { useStreak } from '@/features/gamification/use-streak';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function ProfileScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const { longest } = useStreak();

  const [totalXp, setTotalXp] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setTotalXp(getTotalXp());
    }, []),
  );

  const links = [
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
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t.tabs.profile}
          </ThemedText>
        </View>

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

        <RowGroup>
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

        <ThemedView style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary">
            {t.profile.version} {version}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {t.profile.disclaimer}
          </ThemedText>
        </ThemedView>
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
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
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
