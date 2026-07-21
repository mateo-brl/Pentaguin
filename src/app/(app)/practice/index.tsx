import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { Spacing } from '@/theme';
import { getPracticeExercises, type PracticeExercise } from '@/content/practice';
import { isRecommended } from '@/features/rank/recommend';
import { useRank } from '@/features/rank/ranks';
import { useHues } from '@/hooks/use-hues';
import { useStrings } from '@/i18n/strings';

const ICONS: Record<PracticeExercise['kind'], keyof typeof Ionicons.glyphMap> = {
  terminal: 'terminal',
  analysis: 'search',
  order: 'swap-vertical',
  scenario: 'git-branch',
};

export default function PracticeListScreen() {
  const t = useStrings();
  const { hueFor } = useHues();
  const rank = useRank();
  const exercises = getPracticeExercises();

  const kindLabel: Record<PracticeExercise['kind'], string> = {
    terminal: t.practice.kindTerminal,
    analysis: t.practice.kindAnalysis,
    order: t.practice.kindOrder,
    scenario: t.practice.kindScenario,
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.practice.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {t.practice.subtitle}
        </ThemedText>
        <RowGroup>
          {exercises.map((ex, index) => {
            const hue = hueFor(index);
            const reco = rank != null && isRecommended(ex, rank);
            return (
              <Row
                key={ex.id}
                first={index === 0}
                title={ex.title}
                subtitle={`${kindLabel[ex.kind]}${reco ? ` · ${t.learn.forYourRank}` : ''}`}
                leading={
                  <SquareBadge color={hue.base} background={hue.soft}>
                    <Ionicons name={ICONS[ex.kind]} size={18} color={hue.base} />
                  </SquareBadge>
                }
                onPress={() => router.push({ pathname: '/practice/[id]', params: { id: ex.id } })}
              />
            );
          })}
        </RowGroup>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base },
});
