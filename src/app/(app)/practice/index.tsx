import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { Radius, Spacing, domainColor } from '@/theme';
import {
  getPracticeExercises,
  getPracticeMissions,
  type PracticeExercise,
} from '@/content/practice';
import { getKv } from '@/db/repositories';
import { tapFeedback } from '@/features/haptics/haptics';
import { isRecommended } from '@/features/rank/recommend';
import { useRank } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const ICONS: Record<PracticeExercise['kind'], keyof typeof Ionicons.glyphMap> = {
  terminal: 'terminal',
  analysis: 'search',
  order: 'swap-vertical',
  scenario: 'git-branch',
};

export default function PracticeListScreen() {
  const t = useStrings();
  const theme = useTheme();
  const rank = useRank();
  const exercises = getPracticeExercises();
  const missions = getPracticeMissions();

  const kindLabel: Record<PracticeExercise['kind'], string> = {
    terminal: t.practice.kindTerminal,
    analysis: t.practice.kindAnalysis,
    order: t.practice.kindOrder,
    scenario: t.practice.kindScenario,
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.practice.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {missions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">{t.practice.missions}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.practice.missionsSubtitle}
              </ThemedText>
            </View>
            <View style={styles.missionList}>
              {missions.map((mission, index) => {
                const hue = domainColor(index);
                const done = Boolean(getKv(`mission_done:${mission.id}`));
                return (
                  <Pressable
                    key={mission.id}
                    onPress={() => {
                      tapFeedback();
                      router.push({
                        pathname: '/practice/mission/[id]',
                        params: { id: mission.id },
                      });
                    }}
                    style={[
                      styles.missionCard,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}>
                    <View style={styles.missionHead}>
                      <SquareBadge color={hue.base} background={hue.soft}>
                        <Ionicons
                          name={done ? 'checkmark-done' : 'flag'}
                          size={18}
                          color={done ? theme.success : hue.base}
                        />
                      </SquareBadge>
                      <View style={styles.flex}>
                        <ThemedText type="smallBold">{mission.title}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {mission.tagline}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </View>
                    <ThemedText type="mono" themeColor="textSecondary" style={styles.missionMeta}>
                      {t.practice.missionSteps.replace('{n}', String(mission.steps.length))}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">{t.practice.freeTraining}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.practice.subtitle}
          </ThemedText>
        </View>
        <RowGroup>
          {exercises.map((ex, index) => {
            const hue = domainColor(index);
            const reco = rank != null && isRecommended(ex, rank);
            return (
              <Row
                key={ex.id}
                first={index === 0}
                title={ex.title}
                subtitle={`${kindLabel[ex.kind]}${reco ? ` · ${t.learn.forYourRank}` : ''}`}
                leading={
                  <SquareBadge color={hue.base} background={hue.soft}>
                    <Ionicons name={ICONS[ex.kind]} size={18} color={hue.base} />
                  </SquareBadge>
                }
                onPress={() => router.push({ pathname: '/practice/[id]', params: { id: ex.id } })}
              />
            );
          })}
        </RowGroup>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base },
  flex: { flex: 1 },
  sectionHeader: { gap: Spacing.xs },
  missionList: { gap: Spacing.sm },
  missionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  missionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  missionMeta: { fontSize: 12 },
});
