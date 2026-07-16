import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack, getDomain, lessonsByDomain } from '@/content';
import { getCompletedLessonIds } from '@/db/repositories';
import { isUnlockedNow, packEntitlement, useEntitlements } from '@/features/monetization';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

// Constant (parse mis en cache) : hissé au niveau module pour que le React
// Compiler puisse préserver la mémoïsation du callback de focus ci-dessous.
const pack = getDefaultPack();

export default function DomainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const domain = id ? getDomain(pack, id) : undefined;

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      setCompleted(getCompletedLessonIds(pack.id));
    }, []),
  );

  if (!domain) {
    return null;
  }

  const lessons = lessonsByDomain(pack, domain.id);
  const unlocked = isUnlockedNow(
    { kind: 'lesson', domainId: domain.id, entitlement: packEntitlement(pack.id) },
    entitlements,
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: `${domain.code} · ${domain.title}` }}
      />
      {lessons.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          {t.domain.empty}
        </ThemedText>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(lesson) => lesson.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isDone = completed.has(item.id);
            const card = (
              <ThemedView type="backgroundElement" style={[styles.card, !unlocked && styles.locked]}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                  {isDone && (
                    <ThemedText type="smallBold" style={{ color: theme.success }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {unlocked
                    ? `${item.estMinutes} ${t.domain.minutes}`
                    : `🔒 ${t.lesson.locked}`}
                </ThemedText>
              </ThemedView>
            );
            if (!unlocked) {
              // TODO(M6) : ouvrir le paywall (unique point d'entrée monétisation)
              return card;
            }
            return (
              <Link href={{ pathname: '/lesson/[id]', params: { id: item.id } }} asChild>
                <Pressable>{card}</Pressable>
              </Link>
            );
          }}
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
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  locked: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: {
    flex: 1,
  },
});
