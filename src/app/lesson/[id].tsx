import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { XP } from '@/config/gamification';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import {
  addDailyXp,
  bumpQuestionStat,
  getCompletedLessonIds,
  markLessonCompleted,
} from '@/db/repositories';
import { LessonBlockView } from '@/features/lessons/lesson-blocks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const theme = useTheme();
  const pack = getDefaultPack();
  const lesson = pack.lessons.find((l) => l.id === id);
  const [completed, setCompleted] = useState(() =>
    lesson ? getCompletedLessonIds(pack.id).has(lesson.id) : false,
  );

  if (!lesson) return null;

  const markDone = () => {
    markLessonCompleted(pack.id, lesson.id);
    addDailyXp(XP.lessonCompleted);
    setCompleted(true);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: lesson.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          ⏱ {lesson.estMinutes} {t.domain.minutes}
        </ThemedText>

        {lesson.blocks.map((block, index) => (
          <LessonBlockView
            key={index}
            block={block}
            pack={pack}
            onQuickcheckAnswered={(questionId, result) => {
              bumpQuestionStat(pack.id, questionId, result.isCorrect);
              if (result.isCorrect) addDailyXp(XP.correctAnswer);
            }}
          />
        ))}

        {completed ? (
          <ThemedView style={[styles.done, { backgroundColor: theme.successSoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              {t.lesson.done}
            </ThemedText>
          </ThemedView>
        ) : (
          <Pressable onPress={markDone} style={[styles.done, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {t.lesson.markDone}
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
  done: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
