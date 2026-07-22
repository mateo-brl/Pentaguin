import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ScreenFallback } from '@/components/ui/screen-fallback';
import { getPracticeExercise } from '@/content/practice';
import { ExercisePlayer } from '@/features/practice/exercise-player';

export default function PracticeExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = id ? getPracticeExercise(id) : undefined;
  if (!exercise) return <ScreenFallback />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: true, title: exercise.title }} />
      <ExercisePlayer exercise={exercise} />
    </ThemedView>
  );
}
