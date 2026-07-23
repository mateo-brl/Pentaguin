import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ScreenFallback } from '@/components/ui/screen-fallback';
import { XP } from '@/config/gamification';
import { Radius, Spacing } from '@/theme';
import { getPracticeExercise, getPracticeMission } from '@/content/practice';
import { addDailyXp, getKv, setKv } from '@/db/repositories';
import { successFeedback } from '@/features/haptics/haptics';
import { ExercisePlayer } from '@/features/practice/exercise-player';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/** Bonus de mission crédité une seule fois (le classement partage l'XP). */
function rewardMissionOnce(id: string) {
  const key = `mission_done:${id}`;
  if (getKv(key)) return;
  setKv(key, '1');
  addDailyXp(XP.missionCompleted);
}

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const theme = useTheme();
  const mission = getPracticeMission(id ?? '');
  const [phase, setPhase] = useState<'intro' | 'steps' | 'debrief'>('intro');
  const [stepIndex, setStepIndex] = useState(0);

  if (!mission) return <ScreenFallback />;
  // Étapes résolues vers leurs exercices ; un id cassé est ignoré (pas de crash).
  const exercises = mission.steps
    .map((stepId) => getPracticeExercise(stepId))
    .filter((e) => e != null);
  const total = exercises.length;
  if (total === 0) return <ScreenFallback />;

  const nextStep = () => {
    const next = stepIndex + 1;
    if (next < total) {
      setStepIndex(next);
    } else {
      rewardMissionOnce(mission.id);
      successFeedback();
      setPhase('debrief');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: mission.title }} />

      {phase === 'intro' && (
        <ScrollView contentContainerStyle={styles.centered}>
          <Penguin state="focus" accessory="headset" size={120} animation="float" />
          <ThemedText type="label" themeColor="accent">
            {t.practice.missionBriefing}
          </ThemedText>
          <ThemedText style={styles.intro}>{mission.intro}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.practice.missionSteps.replace('{n}', String(total))}
          </ThemedText>
          <Button
            label={t.practice.missionStart}
            onPress={() => setPhase('steps')}
            style={styles.cta}
          />
        </ScrollView>
      )}

      {phase === 'steps' && (
        <View style={styles.flex}>
          <View style={styles.stepHeader}>
            <ThemedText type="mono" themeColor="textSecondary" style={styles.stepLabel}>
              {t.practice.missionStepOf
                .replace('{i}', String(stepIndex + 1))
                .replace('{n}', String(total))}
            </ThemedText>
            <View style={styles.dots}>
              {exercises.map((ex, i) => (
                <View
                  key={ex.id}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i < stepIndex ? theme.success : i === stepIndex ? theme.accent : theme.backgroundElement,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <ExercisePlayer
            key={exercises[stepIndex].id}
            exercise={exercises[stepIndex]}
            onComplete={nextStep}
          />
        </View>
      )}

      {phase === 'debrief' && (
        <ScrollView contentContainerStyle={styles.centered}>
          <Penguin state="rankup" accessory="terminal" size={120} animation="pop" />
          <ThemedText type="subtitle">{t.practice.missionDone}</ThemedText>
          <View style={[styles.debriefCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="label" themeColor="accent">
              {t.practice.missionDebrief}
            </ThemedText>
            <ThemedText type="small">{mission.debrief}</ThemedText>
          </View>
          <ThemedText type="smallBold" style={{ color: theme.success }}>
            +{XP.missionCompleted} XP
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.practice.missionRedo}
          </ThemedText>
          <Button label={t.practice.finish} onPress={() => router.back()} style={styles.cta} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    padding: Spacing.lg,
  },
  intro: {
    textAlign: 'center',
    lineHeight: 24,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
  },
  stepLabel: {
    fontSize: 13,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  debriefCard: {
    alignSelf: 'stretch',
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
});
