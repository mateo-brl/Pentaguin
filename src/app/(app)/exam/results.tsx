import { Link, Redirect, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import { DEFAULT_PACK_ID, getDefaultPack } from '@/content';
import { getCompletedLessonIds } from '@/db/repositories';
import { useExamSession } from '@/features/exam/session';
import { maybeProposeStreakReminder } from '@/features/gamification/reminders';
import {
  activeProvider,
  canShowSpontaneousUpsell,
  getUpsellShownCount,
  isCrucialUpsellMoment,
  markUpsellShown,
} from '@/features/monetization';
import { isAnswerCorrect, scorePct } from '@/features/quiz/logic';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';


export default function ExamResultsScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const { questions, selections, finished } = useExamSession();

  // L'UNIQUE proposition spontanée de l'app : fin du premier examen blanc
  // gratuit — le moment où l'utilisateur atteint naturellement la limite.
  const [showUpsell, setShowUpsell] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!useExamSession.getState().finished) return;
      void maybeProposeStreakReminder();
      const entitlements = await activeProvider.getEntitlements();
      // Moment clé : fin d'un examen ET l'utilisateur a déjà exploré le gratuit
      // (≥ UPSELL_MIN_LESSONS leçons). Jamais « dès l'inscription ».
      const completedLessons = getCompletedLessonIds(DEFAULT_PACK_ID).size;
      if (
        mounted &&
        canShowSpontaneousUpsell(getUpsellShownCount(), entitlements) &&
        isCrucialUpsellMoment(completedLessons)
      ) {
        setShowUpsell(true);
        markUpsellShown();
      }
    })();
    return () => {
      mounted = false;
    };
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
        <View style={styles.hero}>
          <ThemedText type="label">{t.exam.resultsTitle}</ThemedText>
          <ThemedText
            type="stat"
            style={{ color: happy ? theme.success : theme.streak, fontSize: 56, lineHeight: 62 }}>
            {pct} %
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {correctCount}/{questions.length} {t.quiz.correctCount}
          </ThemedText>
        </View>

        <ThemedText type="label">{t.exam.byDomain}</ThemedText>
        <Card style={styles.domains}>
          {byDomain.map(({ domain, total, correct }, index) => {
            const domainPct = scorePct(correct, total);
            return (
              <View
                key={domain.id}
                style={[
                  styles.domainRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                ]}>
                <View style={styles.domainHeader}>
                  <ThemedText type="small" style={styles.domainTitle}>
                    <ThemedText type="mono" themeColor="accent" style={styles.domainCode}>
                      {domain.code}
                    </ThemedText>
                    {'  '}
                    {domain.title}
                  </ThemedText>
                  <ThemedText type="mono" themeColor="textSecondary" style={styles.domainScore}>
                    {correct}/{total}
                  </ThemedText>
                </View>
                <ProgressBar
                  value={domainPct / 100}
                  color={domainPct >= 70 ? theme.success : theme.streak}
                />
              </View>
            );
          })}
        </Card>

        {wrong.length > 0 && (
          <>
            <ThemedText type="label" themeColor="danger">
              {t.exam.review} ({wrong.length})
            </ThemedText>
            {wrong.map((question) => (
              <Card key={question.id}>
                <ThemedText type="smallBold">{question.stem}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {question.explanation}
                </ThemedText>
              </Card>
            ))}
          </>
        )}

        {showUpsell && (
          <Link href="/paywall" asChild>
            <Pressable style={({ pressed }) => pressed && { opacity: 0.85 }}>
              <Card background={theme.accentSoft} style={styles.upsell}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  {t.paywall.upsellTitle}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.paywall.upsellDesc}
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  {t.paywall.upsellCta}
                </ThemedText>
              </Card>
            </Pressable>
          </Link>
        )}

        <Button label={t.exam.backTrain} onPress={backToTrain} />
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
    paddingVertical: Spacing.five,
  },
  domains: {
    padding: 0,
    gap: 0,
  },
  domainRow: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  domainTitle: {
    flex: 1,
  },
  domainCode: {
    fontSize: 13,
  },
  domainScore: {
    fontSize: 13,
  },
  upsell: {
    borderColor: 'transparent',
  },
});
