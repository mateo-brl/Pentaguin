import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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
      <ThemedText>{question.stem}</ThemedText>
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
              style={[
                styles.choice,
                {
                  backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: isSelected ? theme.accent : theme.backgroundElement,
                },
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.letter}>
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
    gap: Spacing.three,
  },
  choices: {
    gap: Spacing.two,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  letter: {
    minWidth: 18,
  },
  text: {
    flex: 1,
  },
});
