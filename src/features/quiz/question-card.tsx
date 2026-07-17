import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import type { Question } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

import { isAnswerCorrect } from './logic';

export type QuestionCardResult = { selected: string[]; isCorrect: boolean };

type Props = {
  question: Question;
  onAnswered?: (result: QuestionCardResult) => void;
};

/**
 * Question à choix avec validation et feedback immédiat (surlignage + explication).
 * Monter avec key={question.id} pour réinitialiser l'état entre deux questions.
 */
export function QuestionCard({ question, onAnswered }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [validated, setValidated] = useState(false);
  const theme = useTheme();
  const t = useStrings();

  const correct = validated && isAnswerCorrect(question, selected);

  const toggle = (choiceId: string) => {
    if (validated) return;
    if (question.type === 'single') {
      setSelected([choiceId]);
    } else {
      setSelected((current) =>
        current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId],
      );
    }
  };

  const validate = () => {
    const isCorrect = isAnswerCorrect(question, selected);
    setValidated(true);
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    onAnswered?.({ selected, isCorrect });
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.stem}>{question.stem}</ThemedText>
      {question.type === 'multi' && (
        <ThemedText type="small" themeColor="textSecondary">
          {t.quiz.multiHint}
        </ThemedText>
      )}

      <View style={styles.choices}>
        {question.choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          const isExpected = question.correct.includes(choice.id);
          let background: string = theme.backgroundElement;
          let border: string = theme.border;
          let letterColor: string = theme.textSecondary;
          if (validated && isExpected) {
            background = theme.successSoft;
            border = theme.success;
            letterColor = theme.success;
          } else if (validated && isSelected && !isExpected) {
            background = theme.dangerSoft;
            border = theme.danger;
            letterColor = theme.danger;
          } else if (isSelected) {
            background = theme.backgroundSelected;
            border = theme.accent;
            letterColor = theme.accent;
          }
          return (
            <Pressable
              key={choice.id}
              disabled={validated}
              onPress={() => toggle(choice.id)}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: background, borderColor: border },
                pressed && !validated && styles.pressed,
              ]}>
              <ThemedText type="mono" style={[styles.choiceLetter, { color: letterColor }]}>
                {choice.id.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" style={styles.choiceText}>
                {choice.text}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {!validated ? (
        <Button label={t.quiz.validate} onPress={validate} disabled={selected.length === 0} />
      ) : (
        <View
          style={[
            styles.feedback,
            { backgroundColor: correct ? theme.successSoft : theme.dangerSoft },
          ]}>
          <ThemedText type="label" style={{ color: correct ? theme.success : theme.danger }}>
            {correct ? t.quiz.correct : t.quiz.incorrect}
          </ThemedText>
          <ThemedText type="small">{question.explanation}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  stem: {
    fontWeight: 500,
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
  feedback: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
