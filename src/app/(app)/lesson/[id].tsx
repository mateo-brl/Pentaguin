import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FadeOut } from '@/components/ui/fade-out';
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
import {
  canShowSpontaneousUpsell,
  getUpsellShownCount,
  isCrucialUpsellMoment,
  isEndOfFreeThemeMoment,
  isLessonUnlockedNow,
  markUpsellShown,
  useEntitlements,
} from '@/features/monetization';
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
  // Proposition spontanée « fin du gratuit d'un thème » (1 fois à vie, cf. finish).
  const [showThemeOffer, setShowThemeOffer] = useState(false);

  if (!lesson) return <ScreenFallback />;

  // — Leçon Pro : aperçu « eau à la bouche » (on lit le début) puis invitation
  //   douce. Pas un mur : on donne d'abord, on propose ensuite, sortie facile.
  if (!isLessonUnlockedNow(lesson, entitlements)) {
    let previewCount = 0;
    for (const block of lesson.blocks) {
      if (isInteractiveBlock(block) || previewCount >= 3) break;
      previewCount += 1;
    }
    previewCount = Math.max(1, previewCount);

    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: lesson.title }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.meta}>
            {lesson.estMinutes} {t.domain.minutes}
          </ThemedText>
          {lesson.blocks.slice(0, previewCount).map((block, index) => (
            <LessonBlockView key={index} block={block} pack={pack} />
          ))}
          <FadeOut color={theme.background} />
          <View style={[styles.curtain, { backgroundColor: theme.backgroundElement, borderColor: theme.accent }]}>
            <Ionicons name="sparkles" size={22} color={theme.accent} />
            <ThemedText type="subtitle" style={styles.curtainTitle}>
              {t.lesson.previewTitle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.curtainBody}>
              {t.lesson.previewBody}
            </ThemedText>
            <Button label={t.lesson.previewCta} onPress={() => router.push('/paywall')} style={styles.curtainCta} />
            <Button label={t.lesson.previewBack} variant="ghost" onPress={() => router.back()} />
          </View>
        </ScrollView>
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
      // Bon moment pour L'UNIQUE proposition spontanée : l'utilisateur vient
      // d'épuiser le gratuit de ce thème (pic de satisfaction), pas à froid.
      const done = getCompletedLessonIds(pack.id); // inclut la leçon qu'on vient de finir
      if (
        isEndOfFreeThemeMoment(lesson, done, entitlements) &&
        canShowSpontaneousUpsell(getUpsellShownCount(), entitlements) &&
        isCrucialUpsellMoment(done.size)
      ) {
        setShowThemeOffer(true);
        markUpsellShown();
      }
    }
  };

  const advance = () => {
    if (finished) return;
    if (revealed >= blocks.length) {
      finish();
    } else {
      setRevealed(revealed + 1);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: lesson.title }} />

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

            {showThemeOffer ? (
              <View style={[styles.curtain, { backgroundColor: theme.backgroundElement, borderColor: theme.accent }]}>
                <Penguin state="rankup" accessory="terminal" size={64} animation="pop" />
                <ThemedText type="subtitle" style={styles.curtainTitle}>
                  {t.lesson.freeThemeTitle}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.curtainBody}>
                  {t.lesson.freeThemeBody}
                </ThemedText>
                <Button label={t.lesson.previewCta} onPress={() => router.push('/paywall')} style={styles.curtainCta} />
                <Button label={t.lesson.backToLessons} variant="ghost" onPress={() => router.back()} />
              </View>
            ) : (
              <Button label={t.lesson.backToLessons} onPress={() => router.back()} style={styles.doneButton} />
            )}
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
  curtain: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  curtainTitle: {
    textAlign: 'center',
  },
  curtainBody: {
    textAlign: 'center',
  },
  curtainCta: {
    alignSelf: 'stretch',
    marginTop: Spacing.xs,
  },
});
