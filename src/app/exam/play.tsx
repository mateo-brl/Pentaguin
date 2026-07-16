import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import { ExamQuestion } from '@/features/exam/exam-question';
import { useExamSession } from '@/features/exam/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ExamPlayScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { questions, currentIndex, selections, flagged, endsAt, finished } = useExamSession();
  const [now, setNow] = useState(() => Date.now());

  // Horloge de l'épreuve : rafraîchit l'affichage et clôt à l'expiration.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      const state = useExamSession.getState();
      if (!state.finished && state.endsAt && Date.now() >= state.endsAt) {
        state.finish();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (finished) return <Redirect href="/exam/results" />;
  if (questions.length === 0) return <Redirect href="/exam" />;

  const question = questions[currentIndex];
  const selected = selections[question.id] ?? [];
  const isFlagged = Boolean(flagged[question.id]);
  const isLast = currentIndex + 1 === questions.length;
  const remaining = (endsAt ?? now) - now;
  const lowTime = remaining < 5 * 60_000;

  const toggle = (choiceId: string) => {
    const next =
      question.type === 'single'
        ? [choiceId]
        : selected.includes(choiceId)
          ? selected.filter((id) => id !== choiceId)
          : [...selected, choiceId];
    useExamSession.getState().select(question.id, next);
  };

  const confirmFinish = () => {
    const unanswered = questions.filter((q) => !(selections[q.id]?.length > 0)).length;
    Alert.alert(t.exam.confirmTitle, `${unanswered} ${t.exam.confirmBody}`, [
      { text: t.exam.keepGoing, style: 'cancel' },
      {
        text: t.exam.confirm,
        style: 'destructive',
        onPress: () => useExamSession.getState().finish(),
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${currentIndex + 1}/${questions.length}`,
          headerBackVisible: false,
          headerRight: () => (
            <ThemedText type="mono" style={{ color: lowTime ? theme.danger : theme.accent }}>
              {formatRemaining(remaining)}
            </ThemedText>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ProgressBar value={(currentIndex + 1) / questions.length} />

        <ExamQuestion question={question} selected={selected} onToggle={toggle} />

        <Pressable
          onPress={() => useExamSession.getState().toggleFlag(question.id)}
          style={({ pressed }) => [styles.flag, pressed && styles.pressed]}>
          <ThemedText
            type="smallBold"
            style={{ color: isFlagged ? theme.streak : theme.textSecondary }}>
            {isFlagged ? t.exam.unflag : t.exam.flag}
          </ThemedText>
        </Pressable>

        <View style={styles.nav}>
          <Button
            label={t.exam.previous}
            onPress={() => useExamSession.getState().goTo(currentIndex - 1)}
            variant="secondary"
            disabled={currentIndex === 0}
            style={styles.navButton}
          />
          {isLast ? (
            <Button label={t.exam.finish} onPress={confirmFinish} style={styles.navButton} />
          ) : (
            <Button
              label={t.exam.next}
              onPress={() => useExamSession.getState().goTo(currentIndex + 1)}
              style={styles.navButton}
            />
          )}
        </View>

        {!isLast && (
          <Pressable onPress={confirmFinish} style={styles.finishLink}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.exam.finish}
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
  flag: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  nav: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  navButton: {
    flex: 1,
  },
  finishLink: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
