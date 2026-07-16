import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { isUnlockedNow, packEntitlement, useEntitlements } from '@/features/monetization';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function ExamListScreen() {
  const t = useStrings();
  const entitlements = useEntitlements();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.exam.listTitle }} />
      <FlatList
        data={pack.exams}
        keyExtractor={(exam) => exam.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            {t.exam.intro}
          </ThemedText>
        }
        renderItem={({ item, index }) => {
          const unlocked = isUnlockedNow(
            { kind: 'exam', examIndex: index, entitlement: packEntitlement(pack.id) },
            entitlements,
          );
          const card = (
            <ThemedView type="backgroundElement" style={[styles.card, !unlocked && styles.locked]}>
              <ThemedText>{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {unlocked
                  ? `${item.questionCount} ${t.exam.questions} · ${item.durationMin} ${t.domain.minutes}`
                  : `🔒 ${t.exam.locked}`}
              </ThemedText>
            </ThemedView>
          );
          if (!unlocked) {
            // TODO(M6) : ouvrir le paywall
            return card;
          }
          return (
            <Link href={{ pathname: '/exam/[id]', params: { id: item.id } }} asChild>
              <Pressable>{card}</Pressable>
            </Link>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  intro: {
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  locked: {
    opacity: 0.6,
  },
});
