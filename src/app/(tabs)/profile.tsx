import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTotalXp } from '@/db/repositories';
import { useStreak } from '@/features/gamification/use-streak';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function ProfileScreen() {
  const t = useStrings();
  const theme = useTheme();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const { longest } = useStreak();

  const [totalXp, setTotalXp] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setTotalXp(getTotalXp());
    }, []),
  );

  const links = [
    { key: 'leaderboard', icon: 'podium-outline' as const, title: t.profile.leaderboard, href: '/leaderboard' as const },
    { key: 'account', icon: 'person-circle-outline' as const, title: t.profile.account, href: '/account' as const },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">{t.tabs.profile}</ThemedText>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <ThemedText type="stat" themeColor="accent" style={styles.statValue}>
              {totalXp}
            </ThemedText>
            <ThemedText type="label">{t.profile.xpTotal}</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <ThemedText type="stat" themeColor="streak" style={styles.statValue}>
              {longest}
            </ThemedText>
            <ThemedText type="label">{t.profile.bestStreak}</ThemedText>
          </Card>
        </View>

        {links.map((item) => (
          <Link key={item.key} href={item.href} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.linkCard}>
                <Ionicons name={item.icon} size={20} color={theme.accent} />
                <ThemedText type="smallBold" style={styles.linkTitle}>
                  {item.title}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            </Pressable>
          </Link>
        ))}

        <ThemedView style={styles.footer}>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.version}>
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
    gap: Spacing.two,
  },
  header: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 32,
    lineHeight: 38,
  },
  pressed: {
    opacity: 0.85,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  linkTitle: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.one,
  },
  version: {
    fontSize: 12,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
