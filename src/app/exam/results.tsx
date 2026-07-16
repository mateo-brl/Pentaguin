import { Redirect, router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { useExamSession } from '@/features/exam/session';
import { maybeProposeStreakReminder } from '@/features/gamification/reminders';
import { isAnswerCorrect, scorePct } from '@/features/quiz/logic';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function ExamResultsScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { questions, selections, finished } = useExamSession();

  useEffect(() => {
    if (useExamSession.getState().finished) void maybeProposeStreakReminder();
  }, []);

  if (!finished || questions.length === 0) return <Redirect href="/exam" />;

  const verdicts = questions.map((question) => ({
    question,
    isCorrect: isAnswerCorrect(question, selections[question.id] ?? []),
  }));
  const correctCount = verdicts.filter((v) => v.isCorrect).length;
  const pct = scorePct(correctCount, questions.length);
  const wrong = verdicts.filter((v) => !v.isCorrect).map((v) => v.question);
  const happy = pct >= 70;

  const byDomain = pack.domains
    .map((domain) => {
      const domainVerdicts = verdicts.filter((v) => v.question.domainId === domain.id);
      return {
        domain,
        total: domainVerdicts.length,
        correct: domainVerdicts.filter((v) => v.isCorrect).length,
      };
    })
    .filter((row) => row.total > 0);

  const backToTrain = () => {
    useExamSession.getState().reset();
    router.navigate('/train');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: t.exam.resultsTitle, headerBackVisible: false }}
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

        <ThemedText type="smallBold">{t.exam.byDomain}</ThemedText>
        {byDomain.map(({ domain, total, correct }) => {
          const domainPct = scorePct(correct, total);
          return (
            <View key={domain.id} style={styles.domainRow}>
              <View style={styles.domainHeader}>
                <ThemedText type="small">
                  {domain.code} {domain.title}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {correct}/{total}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: domainPct >= 70 ? theme.success : theme.streak,
                      width: `${domainPct}%` as DimensionValue,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {wrong.length > 0 && (
          <>
            <ThemedText type="smallBold" themeColor="danger">
              {t.exam.review} ({wrong.length})
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

        <Pressable onPress={backToTrain} style={[styles.button, { backgroundColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            {t.exam.backTrain}
          </ThemedText>
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
  domainRow: {
    gap: Spacing.one,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
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
    marginTop: Spacing.two,
  },
});
