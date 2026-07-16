import { Redirect, router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { scorePct } from '@/features/quiz/logic';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function QuizResultsScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { questions, answers, finished } = useQuizSession();

  if (!finished || questions.length === 0) return <Redirect href="/quiz/setup" />;

  const correctCount = questions.filter((q) => answers[q.id]?.isCorrect).length;
  const pct = scorePct(correctCount, questions.length);
  const wrong = questions.filter((q) => answers[q.id] && !answers[q.id].isCorrect);
  const happy = pct >= 70;

  const replay = () => {
    useQuizSession.getState().reset();
    router.replace('/quiz/setup');
  };

  const backToTrain = () => {
    useQuizSession.getState().reset();
    router.navigate('/train');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: t.quiz.resultsTitle, headerBackVisible: false }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.hero}>
          <Text style={styles.mascot}>{happy ? '🐧🎉' : '🐧💪'}</Text>
          <ThemedText type="title" style={{ color: happy ? theme.success : theme.streak }}>
            {pct} %
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {correctCount}/{questions.length} {t.quiz.correctCount}
          </ThemedText>
        </ThemedView>

        {wrong.length > 0 && (
          <>
            <ThemedText type="smallBold" themeColor="danger">
              {t.quiz.review} ({wrong.length})
            </ThemedText>
            {wrong.map((question) => (
              <ThemedView key={question.id} type="backgroundElement" style={styles.reviewCard}>
                <ThemedText type="small">{question.stem}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {question.explanation}
                </ThemedText>
              </ThemedView>
            ))}
          </>
        )}

        <Pressable onPress={replay} style={[styles.button, { backgroundColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            {t.quiz.replay}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={backToTrain}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">{t.quiz.backTrain}</ThemedText>
        </Pressable>
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
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  mascot: {
    fontSize: 48,
  },
  reviewCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
