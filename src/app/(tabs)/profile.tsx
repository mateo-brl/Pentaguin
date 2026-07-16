import Constants from 'expo-constants';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTotalXp } from '@/db/repositories';
import { useStreak } from '@/features/gamification/use-streak';
import { useStrings } from '@/i18n/strings';

export default function ProfileScreen() {
  const t = useStrings();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const { longest } = useStreak();

  const [totalXp, setTotalXp] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setTotalXp(getTotalXp());
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          {t.tabs.profile}
        </ThemedText>

        <View style={styles.statsRow}>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <ThemedText type="subtitle" themeColor="accent">
              {totalXp}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.profile.xpTotal}
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <ThemedText type="subtitle" themeColor="streak">
              {longest}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.profile.bestStreak}
            </ThemedText>
          </ThemedView>
        </View>

        <Link href="/leaderboard" asChild>
          <Pressable>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{t.profile.leaderboard}</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>

        {/* TODO : progression par domaine, historique des tentatives */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            {t.profile.statsSoon}
          </ThemedText>
        </ThemedView>

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
    gap: Spacing.two,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.half,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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
