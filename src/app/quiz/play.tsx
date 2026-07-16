import { Redirect, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { QuestionCard } from '@/features/quiz/question-card';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function QuizPlayScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { questions, currentIndex, answers, finished } = useQuizSession();

  if (finished) return <Redirect href="/quiz/results" />;
  if (questions.length === 0) return <Redirect href="/quiz/setup" />;

  const question = questions[currentIndex];
  const answered = answers[question.id] !== undefined;
  const isLast = currentIndex + 1 === questions.length;
  const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${t.quiz.question} ${currentIndex + 1}/${questions.length}`,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.accent, width: `${progress}%` as DimensionValue },
            ]}
          />
        </View>

        <QuestionCard
          key={question.id}
          question={question}
          onAnswered={(result) => useQuizSession.getState().answerCurrent(result.selected)}
        />

        {answered && (
          <Pressable
            onPress={() => useQuizSession.getState().goNext()}
            style={[styles.next, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {isLast ? t.quiz.seeResults : t.quiz.next}
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
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
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  next: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
