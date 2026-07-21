import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { XP } from '@/config/gamification';
import { Radius, Spacing } from '@/theme';
import { getDefaultPack } from '@/content';
import {
  addDailyXp,
  bumpQuestionStat,
  getCompletedLessonIds,
  markLessonCompleted,
} from '@/db/repositories';
import { LessonBlockView } from '@/features/lessons/lesson-blocks';
import { isLessonUnlockedNow, useEntitlements } from '@/features/monetization';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const pack = getDefaultPack();
  const lesson = pack.lessons.find((l) => l.id === id);
  const [completed, setCompleted] = useState(() =>
    lesson ? getCompletedLessonIds(pack.id).has(lesson.id) : false,
  );

  if (!lesson) return null;

  // Garde Pro : accès direct à une leçon verrouillée → invite à débloquer.
  if (!isLessonUnlockedNow(lesson, entitlements)) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: lesson.title }} />
        <View style={styles.locked}>
          <ThemedText type="subtitle" style={styles.lockedTitle}>
            {t.lesson.locked}
          </ThemedText>
          <Button label={t.paywall.upsellCta} onPress={() => router.push('/paywall')} />
        </View>
      </ThemedView>
    );
  }

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
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    padding: Spacing.lg,
  },
  lockedTitle: {
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  meta: {
    fontSize: 13,
  },
  done: {
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneButton: {
    marginTop: Spacing.sm,
  },
});
