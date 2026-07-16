import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { useEntitlements } from '@/features/monetization';
import { pickQuestions } from '@/features/quiz/logic';
import { playableQuestions } from '@/features/quiz/select';
import { useQuizSession } from '@/features/quiz/session';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const COUNTS = [5, 10, 20];

export default function QuizSetupScreen() {
  const t = useStrings();
  const theme = useTheme();
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

  const chipStyle = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? theme.accent : theme.backgroundElement,
    },
  ];
  const chipText = (selected: boolean) => ({
    color: selected ? theme.onAccent : theme.text,
  });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.quiz.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold">{t.quiz.domain}</ThemedText>
        <View style={styles.chips}>
          <Pressable onPress={() => setDomainId(null)} style={chipStyle(domainId === null)}>
            <ThemedText type="small" style={chipText(domainId === null)}>
              {t.quiz.allDomains}
            </ThemedText>
          </Pressable>
          {pack.domains.map((domain) => (
            <Pressable
              key={domain.id}
              onPress={() => setDomainId(domain.id)}
              style={chipStyle(domainId === domain.id)}>
              <ThemedText type="small" style={chipText(domainId === domain.id)}>
                {domain.code}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="smallBold">{t.quiz.count}</ThemedText>
        <View style={styles.chips}>
          {COUNTS.map((value) => (
            <Pressable key={value} onPress={() => setCount(value)} style={chipStyle(count === value)}>
              <ThemedText type="small" style={chipText(count === value)}>
                {value}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {canStart ? `${available.length} ${t.quiz.availableCount}` : t.quiz.noQuestions}
        </ThemedText>

        <Pressable
          disabled={!canStart}
          onPress={start}
          style={[
            styles.start,
            { backgroundColor: canStart ? theme.accent : theme.backgroundSelected },
          ]}>
          <ThemedText
            type="smallBold"
            style={{ color: canStart ? theme.onAccent : theme.textSecondary }}>
            {t.quiz.start}
          </ThemedText>
        </Pressable>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  start: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
