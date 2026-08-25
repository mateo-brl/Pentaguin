import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/theme';
import { DEFAULT_PACK_ID, getDefaultPack } from '@/content';
import { getDueReviewIds, getWrongQuestionIds } from '@/db/repositories';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const REPLAY_MAX = 20;

/**
 * Révisions : les questions déjà rencontrées reviennent à échéance (répétition
 * espacée). À défaut d'échéance du jour, on propose quand même les questions
 * déjà ratées — l'écran n'est jamais un cul-de-sac.
 */
export default function MistakesScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const [dueIds, setDueIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setDueIds(getDueReviewIds(DEFAULT_PACK_ID));
      setWrongIds(getWrongQuestionIds(DEFAULT_PACK_ID));
    }, []),
  );

  const playable = new Set(playableQuestions(pack, null, entitlements).map((q) => q.id));
  const resolve = (ids: string[]) =>
    ids
      .filter((id) => playable.has(id))
      .map((id) => pack.questions.find((q) => q.id === id))
      .filter((q) => q !== undefined);

  const due = resolve(dueIds);
  // Ce qui a été raté et n'est pas déjà dans la file du jour.
  const dueSet = new Set(due.map((q) => q.id));
  const wrong = resolve(wrongIds).filter((q) => !dueSet.has(q.id));

  const play = (questions: typeof due) => {
    useQuizSession.getState().start(pack.id, questions.slice(0, REPLAY_MAX));
    router.push('/quiz/play');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.mistakes.title }} />
      <FlatList
        data={wrong}
        keyExtractor={(question) => question.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {due.length > 0 ? (
              <Card background={theme.accentSoft} style={styles.dueCard}>
                <View style={styles.dueRow}>
                  <Ionicons name="alarm" size={20} color={theme.accent} />
                  <ThemedText type="label" style={{ color: theme.accent }}>
                    {t.mistakes.dueTitle}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle">
                  {t.mistakes.dueCount.replace('{n}', String(due.length))}
                </ThemedText>
                <Button label={t.mistakes.dueStart} onPress={() => play(due)} style={styles.cta} />
              </Card>
            ) : (
              <Card style={styles.dueCard}>
                <ThemedText type="smallBold" style={{ color: theme.success }}>
                  {t.mistakes.dueEmpty}
                </ThemedText>
              </Card>
            )}

            <ThemedText type="small" themeColor="textSecondary" style={styles.how}>
              {t.mistakes.how}
            </ThemedText>

            {wrong.length > 0 && (
              <View style={styles.otherHeader}>
                <ThemedText type="label">{t.mistakes.otherTitle}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {wrong.length} {t.mistakes.count}
                </ThemedText>
                <Button
                  label={t.mistakes.replay}
                  variant="secondary"
                  onPress={() => play(wrong)}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <ThemedText type="small">{item.stem}</ThemedText>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    gap: Spacing.base,
    marginBottom: Spacing.sm,
  },
  dueCard: {
    gap: Spacing.sm,
    borderColor: 'transparent',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cta: {
    marginTop: Spacing.xs,
  },
  how: {
    fontSize: 12,
    lineHeight: 17,
  },
  otherHeader: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  item: {
    padding: Spacing.base,
  },
});
