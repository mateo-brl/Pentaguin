import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { useEntitlements } from '@/features/monetization';
import { pickQuestions } from '@/features/quiz/logic';
import { playableQuestions } from '@/features/quiz/select';
import { useQuizSession } from '@/features/quiz/session';
import { useStrings } from '@/i18n/strings';

const COUNTS = [5, 10, 20];

export default function QuizSetupScreen() {
  const t = useStrings();
  const pack = getDefaultPack();
  const entitlements = useEntitlements();
  const [domainId, setDomainId] = useState<string | null>(null);
  const [count, setCount] = useState(10);

  const available = playableQuestions(pack, domainId, entitlements);
  const canStart = available.length > 0;

  const start = () => {
    const questions = pickQuestions(available, count);
    useQuizSession.getState().start(pack.id, questions);
    router.push('/quiz/play');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.quiz.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {pack.domains.length > 0 && (
          <>
            <ThemedText type="label">{t.quiz.domain}</ThemedText>
            <View style={styles.chips}>
              <Chip
                label={t.quiz.allDomains}
                selected={domainId === null}
                onPress={() => setDomainId(null)}
              />
              {pack.domains.map((domain) => (
                <Chip
                  key={domain.id}
                  label={domain.code}
                  selected={domainId === domain.id}
                  onPress={() => setDomainId(domain.id)}
                />
              ))}
            </View>
          </>
        )}

        <ThemedText type="label" style={pack.domains.length > 0 ? styles.section : undefined}>
          {t.quiz.count}
        </ThemedText>
        <View style={styles.chips}>
          {COUNTS.map((value) => (
            <Chip
              key={value}
              label={String(value)}
              selected={count === value}
              onPress={() => setCount(value)}
            />
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.availability}>
          {canStart ? `${available.length} ${t.quiz.availableCount}` : t.quiz.noQuestions}
        </ThemedText>

        <Button label={t.quiz.start} onPress={start} disabled={!canStart} />
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
    gap: Spacing.two,
  },
  section: {
    marginTop: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  availability: {
    marginVertical: Spacing.two,
  },
});
