import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { buildExamQuestions } from '@/features/exam/build';
import { useExamSession } from '@/features/exam/session';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function ExamBriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
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
        <Card style={styles.summary}>
          <View style={styles.summaryItem}>
            <ThemedText type="stat">{exam.questionCount}</ThemedText>
            <ThemedText type="label">{t.exam.questions}</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText type="stat">{exam.durationMin}</ThemedText>
            <ThemedText type="label">{t.domain.minutes}</ThemedText>
          </View>
        </Card>

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
    padding: Spacing.four,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  bankNote: {
    fontSize: 13,
  },
  start: {
    marginTop: Spacing.two,
  },
});
