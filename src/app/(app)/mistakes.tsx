import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/theme';
import { DEFAULT_PACK_ID, getDefaultPack } from '@/content';
import { getWrongQuestionIds } from '@/db/repositories';
import { useEntitlements } from '@/features/monetization';
import { playableQuestions } from '@/features/quiz/select';
import { useQuizSession } from '@/features/quiz/session';
import { useStrings } from '@/i18n/strings';

const REPLAY_MAX = 20;

export default function MistakesScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const entitlements = useEntitlements();
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWrongIds(getWrongQuestionIds(DEFAULT_PACK_ID));
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
            <View style={styles.header}>
              <ThemedText type="small" themeColor="textSecondary">
                {questions.length} {t.mistakes.count}
              </ThemedText>
              <Button label={t.mistakes.replay} onPress={replay} />
            </View>
          }
          renderItem={({ item }) => (
            <Card>
              <ThemedText type="small">{item.stem}</ThemedText>
            </Card>
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
    padding: Spacing.lg,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    gap: Spacing.base,
    marginBottom: Spacing.sm,
  },
});
