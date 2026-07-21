import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { buildExamQuestions } from '@/features/exam/build';
import { useExamSession } from '@/features/exam/session';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';


export default function ExamBriefScreen() {
  const pack = getDefaultPack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const exam = pack.exams.find((e) => e.id === id);

  if (!exam) return null;

  const bankSize = playableQuestions(pack, null, entitlements).length;
  const canStart = bankSize > 0;

  const start = () => {
    const questions = buildExamQuestions(pack, exam, entitlements);
    if (questions.length === 0) return;
    useExamSession.getState().start(pack.id, exam, questions);
    router.push('/exam/play');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: exam.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={[styles.summaryTile, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="stat" themeColor="accent" style={styles.summaryValue}>
              {exam.questionCount}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="accent">
              {t.exam.questions}
            </ThemedText>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: theme.streakSoft }]}>
            <ThemedText type="stat" themeColor="streak" style={styles.summaryValue}>
              {exam.durationMin}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="streak">
              {t.domain.minutes}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {t.exam.rules}
        </ThemedText>

        <ThemedText type="mono" themeColor="textSecondary" style={styles.bankNote}>
          {bankSize} {t.exam.bankNote}
        </ThemedText>

        <Button label={t.exam.start} onPress={start} disabled={!canStart} style={styles.start} />
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
  summary: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  summaryValue: {
    fontSize: 36,
    lineHeight: 42,
  },
  bankNote: {
    fontSize: 13,
  },
  start: {
    marginTop: Spacing.two,
  },
});
