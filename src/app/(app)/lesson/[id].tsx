import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScreenFallback } from '@/components/ui/screen-fallback';
import { Button } from '@/components/ui/button';
import { XP } from '@/config/gamification';
import { Radius, Spacing } from '@/theme';
import { getDefaultPack } from '@/content';
import {
  addDailyXp,
  bumpQuestionStat,
  getCompletedLessonIds,
  getKv,
  markLessonCompleted,
  setKv,
} from '@/db/repositories';
import { successFeedback } from '@/features/haptics/haptics';
import { isInteractiveBlock, LessonBlockView } from '@/features/lessons/lesson-blocks';
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
  const scrollRef = useRef<ScrollView>(null);

  const [completed, setCompleted] = useState(() =>
    lesson ? getCompletedLessonIds(pack.id).has(lesson.id) : false,
  );
  // Dévoilement progressif : on avance bloc par bloc (tout est visible en relecture).
  const [revealed, setRevealed] = useState(() =>
    !lesson || completed ? (lesson?.blocks.length ?? 0) : 1,
  );
  const [finished, setFinished] = useState(completed);

  if (!lesson) return <ScreenFallback />;

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

  const blocks = lesson.blocks;
  const gatingBlock = blocks[revealed - 1];
  const waitingOnInteraction = !finished && gatingBlock != null && isInteractiveBlock(gatingBlock);

  const finish = () => {
    setFinished(true);
    if (!completed) {
      markLessonCompleted(pack.id, lesson.id);
      addDailyXp(XP.lessonCompleted);
      setCompleted(true);
      successFeedback();
    }
  };

  const advance = () => {
    if (finished) return;
    if (revealed >= blocks.length) {
      finish();
    } else {
      setRevealed(revealed + 1);
    }
    // Laisse le nouveau bloc se poser avant de faire défiler vers lui.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: lesson.title }} />

      {/* Barre de progression de lecture */}
      <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: finished ? theme.success : theme.accent,
              width: `${Math.round((revealed / blocks.length) * 100)}%`,
            },
          ]}
        />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <ThemedText type="mono" themeColor="textSecondary" style={styles.meta}>
          {lesson.estMinutes} {t.domain.minutes}
        </ThemedText>

        {blocks.slice(0, revealed).map((block, index) => (
          <LessonBlockView
            key={index}
            block={block}
            pack={pack}
            onInteracted={index === revealed - 1 && !finished ? advance : undefined}
            onQuickcheckAnswered={(questionId, result) => {
              bumpQuestionStat(pack.id, questionId, result.isCorrect);
              // XP crédité UNE seule fois par quickcheck (sinon farmable en
              // rouvrant la leçon en boucle — le classement partage l'XP).
              const xpKey = `qc_xp:${questionId}`;
              if (result.isCorrect && !getKv(xpKey)) {
                setKv(xpKey, '1');
                addDailyXp(XP.correctAnswer);
              }
            }}
          />
        ))}

        {finished ? (
          <>
            <View style={[styles.done, { backgroundColor: theme.successSoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.success }}>
                {t.lesson.completedTitle}
              </ThemedText>
              <ThemedText type="small">
                {t.lesson.completedBody.replace('{xp}', String(XP.lessonCompleted))}
              </ThemedText>
            </View>
            <Button
              label={t.lesson.backToLessons}
              onPress={() => router.back()}
              style={styles.doneButton}
            />
          </>
        ) : (
          !waitingOnInteraction && (
            <Button
              label={revealed >= blocks.length ? t.lesson.markDone : t.lesson.continue}
              onPress={advance}
              style={styles.doneButton}
            />
          )
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
  progressTrack: {
    height: 3,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
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
    padding: Spacing.base,
    gap: Spacing.xs,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  doneButton: {
    marginTop: Spacing.sm,
  },
});
