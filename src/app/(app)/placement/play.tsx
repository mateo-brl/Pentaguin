import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FontFamily, Spacing } from '@/constants/theme';
import type { PlacementQuestion } from '@/content/placement';
import { usePlacementSession } from '@/features/placement/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function PlacementPlayScreen() {
  const t = useStrings();
  const { current, finished, state, total, answer } = usePlacementSession();

  if (finished) return <Redirect href="/placement/result" />;
  if (!current) return <Redirect href="/placement" />;

  const isLast = state.step + 1 >= total;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.placement.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <ProgressBar value={state.step / total} height={10} />
          </View>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.counter}>
            {state.step + 1}/{total}
          </ThemedText>
        </View>

        <PlacementQuestionView
          key={current.id}
          question={current}
          validateLabel={isLast ? t.placement.finish : t.placement.validate}
          onAnswer={(correct) => answer(correct)}
        />
      </ScrollView>
    </ThemedView>
  );
}

/** Question de positionnement : sélection simple, AUCUN feedback (évaluation). */
function PlacementQuestionView({
  question,
  validateLabel,
  onAnswer,
}: {
  question: PlacementQuestion;
  validateLabel: string;
  onAnswer: (correct: boolean) => void;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      <ThemedText style={styles.stem}>{question.stem}</ThemedText>
      <View style={styles.choices}>
        {question.choices.map((choice) => {
          const isSelected = selected === choice.id;
          return (
            <Pressable
              key={choice.id}
              onPress={() => setSelected(choice.id)}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText
                type="mono"
                style={[styles.choiceLetter, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                {choice.id.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" style={styles.choiceText}>
                {choice.text}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={validateLabel}
        disabled={selected === null}
        onPress={() => selected !== null && onAnswer(selected === question.correct)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  progressTrack: {
    flex: 1,
  },
  counter: {
    fontSize: 13,
  },
  card: {
    gap: Spacing.three,
  },
  stem: {
    fontFamily: FontFamily.medium,
  },
  choices: {
    gap: Spacing.two,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  choiceLetter: {
    fontSize: 13,
    minWidth: 16,
  },
  choiceText: {
    flex: 1,
  },
});
