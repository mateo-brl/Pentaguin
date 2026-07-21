import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/theme';
import { usePlacementSession } from '@/features/placement/session';
import { useStrings } from '@/i18n/strings';

export default function PlacementIntroScreen() {
  const t = useStrings();
  const start = usePlacementSession((s) => s.start);
  const started = usePlacementSession((s) => s.state.step > 0 && !s.finished);

  // Prépare la session (reprise si un test est en cours, sinon neuf).
  useEffect(() => {
    start();
  }, [start]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Penguin state="focus" size={116} animation="float" />
          <ThemedText type="title" style={styles.title}>
            {t.placement.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            {t.placement.intro}
          </ThemedText>
        </View>

        <Button
          label={started ? t.placement.resume : t.placement.start}
          onPress={() => router.push('/placement/play')}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
  },
  intro: {
    textAlign: 'center',
  },
});
