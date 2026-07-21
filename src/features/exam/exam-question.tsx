import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/theme';
import type { Question } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

type Props = {
  question: Question;
  selected: string[];
  onToggle: (choiceId: string) => void;
};

/** Question en mode examen : sélection modifiable, aucun feedback avant la fin. */
export function ExamQuestion({ question, selected, onToggle }: Props) {
  const theme = useTheme();
  const t = useStrings();

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
          return (
            <Pressable
              key={choice.id}
              onPress={() => onToggle(choice.id)}
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
                style={[styles.letter, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                {choice.id.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" style={styles.text}>
                {choice.text}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.base,
  },
  stem: {
    fontFamily: FontFamily.medium,
  },
  choices: {
    gap: Spacing.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  letter: {
    fontSize: 13,
    minWidth: 16,
  },
  text: {
    flex: 1,
  },
});
