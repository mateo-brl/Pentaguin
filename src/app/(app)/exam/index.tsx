import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import { isUnlockedNow, packEntitlement, useEntitlements } from '@/features/monetization';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';


export default function ExamListScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
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
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            {t.exam.empty}
          </ThemedText>
        }
        renderItem={({ item, index }) => {
          const unlocked = isUnlockedNow(
            { kind: 'exam', examIndex: index, entitlement: packEntitlement(pack.id) },
            entitlements,
          );
          const href = unlocked
            ? ({ pathname: '/exam/[id]', params: { id: item.id } } as const)
            : ('/paywall' as const);
          return (
            <Link href={href} asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <Card style={[styles.card, !unlocked && styles.locked]}>
                  <View style={styles.body}>
                    <ThemedText type="smallBold">{item.title}</ThemedText>
                    <ThemedText type="mono" themeColor="textSecondary" style={styles.meta}>
                      {unlocked
                        ? `${item.questionCount} ${t.exam.questions} · ${item.durationMin} ${t.domain.minutes}`
                        : t.exam.locked}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={unlocked ? 'chevron-forward' : 'lock-closed-outline'}
                    size={18}
                    color={theme.textSecondary}
                  />
                </Card>
              </Pressable>
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
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  locked: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  meta: {
    fontSize: 13,
  },
});
