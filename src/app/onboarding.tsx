import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { completeOnboarding } from '@/features/settings/first-run';
import { useHues } from '@/hooks/use-hues';
import { useStrings } from '@/i18n/strings';

export default function OnboardingScreen() {
  const t = useStrings();
  const { hueFor } = useHues();

  const bullets = [
    { icon: 'book' as const, text: t.onboarding.bullet1, hue: hueFor(0) },
    { icon: 'timer' as const, text: t.onboarding.bullet2, hue: hueFor(3) },
    { icon: 'trophy' as const, text: t.onboarding.bullet3, hue: hueFor(2) },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Le manchot accueille : première impression de la marque. */}
          <Penguin state="correct" size={128} animation="float" style={styles.hero} />

          <View style={styles.header}>
            <ThemedText type="title">{t.onboarding.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.onboarding.subtitle}
            </ThemedText>
          </View>

          <View style={styles.bullets}>
            {bullets.map((bullet) => (
              <View key={bullet.icon} style={styles.bullet}>
                <View style={[styles.badge, { backgroundColor: bullet.hue.soft }]}>
                  <Ionicons name={bullet.icon} size={22} color={bullet.hue.base} />
                </View>
                <ThemedText type="small" style={styles.bulletText}>
                  {bullet.text}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <Button label={t.onboarding.cta} onPress={completeOnboarding} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.two,
  },
  bullets: {
    gap: Spacing.three,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
  },
});
