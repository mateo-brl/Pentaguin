import { Redirect, Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/theme';
import { QuestionCard } from '@/features/quiz/question-card';
import { useQuizSession } from '@/features/quiz/session';
import { useStrings } from '@/i18n/strings';

export default function QuizPlayScreen() {
  const t = useStrings();
  const { questions, currentIndex, answers, finished } = useQuizSession();

  if (finished) return <Redirect href="/quiz/results" />;
  if (questions.length === 0) return <Redirect href="/quiz/setup" />;

  const question = questions[currentIndex];
  const answered = answers[question.id] !== undefined;
  const isLast = currentIndex + 1 === questions.length;
  const progress = (currentIndex + (answered ? 1 : 0)) / questions.length;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.quiz.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <ProgressBar value={progress} height={10} />
          </View>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.counter}>
            {currentIndex + 1}/{questions.length}
          </ThemedText>
        </View>

        <QuestionCard
          key={question.id}
          question={question}
          onAnswered={(result) => useQuizSession.getState().answerCurrent(result.selected)}
        />

        {answered && (
          <Button
            label={isLast ? t.quiz.seeResults : t.quiz.next}
            onPress={() => useQuizSession.getState().goNext()}
          />
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
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  progressTrack: {
    flex: 1,
  },
  counter: {
    fontSize: 13,
  },
});
