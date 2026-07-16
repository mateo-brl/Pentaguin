import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function HomeScreen() {
  const t = useStrings();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          {/* TODO(M5) : mascotte manchot dessinée (humeurs liées au streak) */}
          <Text style={styles.mascot}>🐧</Text>
          <ThemedText type="title">Pentaguin</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            {t.home.tagline}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold" themeColor="streak">
            🔥 {t.home.streakLabel}
          </ThemedText>
          {/* TODO(M5) : streak réel dérivé de daily_activity */}
          <ThemedText type="subtitle">0 {t.home.days}</ThemedText>
        </ThemedView>

        <Link href="/learn" asChild>
          <Pressable style={[styles.cta, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {t.home.continueCta}
            </ThemedText>
          </Pressable>
        </Link>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{t.home.dailyChallenge}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.home.comingSoon}
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
  cta: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
