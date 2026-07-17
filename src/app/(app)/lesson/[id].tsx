import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
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
        <ThemedText type="mono" themeColor="textSecondary" style={styles.meta}>
          {lesson.estMinutes} {t.domain.minutes}
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
          <View style={[styles.done, { backgroundColor: theme.successSoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              {t.lesson.done}
            </ThemedText>
          </View>
        ) : (
          <Button label={t.lesson.markDone} onPress={markDone} style={styles.doneButton} />
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
  meta: {
    fontSize: 13,
  },
  done: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  doneButton: {
    marginTop: Spacing.two,
  },
});
