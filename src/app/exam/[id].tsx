import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { buildExamQuestions } from '@/features/exam/build';
import { useExamSession } from '@/features/exam/session';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function ExamBriefScreen() {
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
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">
            {exam.questionCount} {t.exam.questions}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="accent">
            ⏱ {exam.durationMin} {t.domain.minutes}
          </ThemedText>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          {t.exam.rules}
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary">
          {bankSize} {t.exam.bankNote}
        </ThemedText>

        <Pressable
          disabled={!canStart}
          onPress={start}
          style={[
            styles.start,
            { backgroundColor: canStart ? theme.accent : theme.backgroundSelected },
          ]}>
          <ThemedText
            type="smallBold"
            style={{ color: canStart ? theme.onAccent : theme.textSecondary }}>
            {t.exam.start}
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  start: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
