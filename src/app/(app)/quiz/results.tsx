import { Redirect, router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/theme';
import { maybeProposeStreakReminder } from '@/features/gamification/reminders';
import { scorePct } from '@/features/quiz/logic';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function QuizResultsScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { questions, answers, finished } = useQuizSession();

  // Première session réussie = LE bon moment pour proposer le rappel (une seule fois, à vie).
  useEffect(() => {
    if (useQuizSession.getState().finished) void maybeProposeStreakReminder();
  }, []);

  if (!finished || questions.length === 0) return <Redirect href="/quiz/setup" />;

  const correctCount = questions.filter((q) => answers[q.id]?.isCorrect).length;
  const pct = scorePct(correctCount, questions.length);
  const wrong = questions.filter((q) => answers[q.id] && !answers[q.id].isCorrect);
  const happy = pct >= 70;

  const replay = () => {
    useQuizSession.getState().reset();
    router.dismissTo('/quiz/setup');
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
        <View style={styles.hero}>
          <ThemedText type="label">{t.quiz.resultsTitle}</ThemedText>
          <ThemedText type="stat" style={{ color: happy ? theme.success : theme.streak, fontSize: 56, lineHeight: 62 }}>
            {pct} %
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {correctCount}/{questions.length} {t.quiz.correctCount}
          </ThemedText>
        </View>

        {wrong.length > 0 && (
          <>
            <ThemedText type="label" themeColor="danger">
              {t.quiz.review} ({wrong.length})
            </ThemedText>
            {wrong.map((question) => (
              <Card key={question.id}>
                <ThemedText type="smallBold">{question.stem}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {question.explanation}
                </ThemedText>
              </Card>
            ))}
          </>
        )}

        <Button label={t.quiz.replay} onPress={replay} />
        <Button label={t.quiz.backTrain} onPress={backToTrain} variant="secondary" />
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
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
});
