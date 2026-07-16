import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { getWrongQuestionIds } from '@/db/repositories';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();
const REPLAY_MAX = 20;

export default function MistakesScreen() {
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWrongIds(getWrongQuestionIds(pack.id));
    }, []),
  );

  const playable = new Set(playableQuestions(pack, null, entitlements).map((q) => q.id));
  const questions = wrongIds
    .filter((id) => playable.has(id))
    .map((id) => pack.questions.find((q) => q.id === id))
    .filter((q) => q !== undefined);

  const replay = () => {
    useQuizSession.getState().start(pack.id, questions.slice(0, REPLAY_MAX));
    router.push('/quiz/play');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.mistakes.title }} />
      {questions.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          {t.mistakes.empty}
        </ThemedText>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(question) => question.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {questions.length} {t.mistakes.count}
              </ThemedText>
              <Pressable onPress={replay} style={[styles.replay, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  {t.mistakes.replay}
                </ThemedText>
              </Pressable>
            </>
          }
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small">{item.stem}</ThemedText>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    padding: Spacing.four,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  replay: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  card: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
});
