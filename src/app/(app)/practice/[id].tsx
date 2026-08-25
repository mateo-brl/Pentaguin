import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProCurtain } from '@/components/ui/pro-curtain';
import { ScreenFallback } from '@/components/ui/screen-fallback';
import { Spacing } from '@/theme';
import { getPracticeExercise } from '@/content/practice';
import { isPracticeUnlockedNow, useEntitlements } from '@/features/monetization';
import { ExercisePlayer } from '@/features/practice/exercise-player';
import { useStrings } from '@/i18n/strings';

export default function PracticeExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const entitlements = useEntitlements();
  const exercise = id ? getPracticeExercise(id) : undefined;
  if (!exercise) return <ScreenFallback />;

  // Exercice Pro : on montre quand même la mise en situation (c'est ce qui donne
  // envie), puis l'invitation. Jamais d'écran vide ni de mur sec.
  if (!isPracticeUnlockedNow(exercise, entitlements)) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: exercise.title }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            {exercise.brief}
          </ThemedText>
          <ProCurtain body={t.practice.previewBody} />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: exercise.title }} />
      <ExercisePlayer exercise={exercise} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base },
});
