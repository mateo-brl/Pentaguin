import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
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
              <Card style={[styles.card, !unlocked && styles.locked]}>
                <View
                  style={[
                    styles.status,
                    { backgroundColor: isDone ? theme.successSoft : theme.backgroundSelected },
                  ]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={16} color={theme.success} />
                  ) : (
                    <ThemedText type="mono" themeColor="textSecondary" style={styles.order}>
                      {item.order}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.body}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {unlocked ? `${item.estMinutes} ${t.domain.minutes}` : t.lesson.locked}
                  </ThemedText>
                </View>
                {unlocked ? (
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                ) : (
                  <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                )}
              </Card>
            );
            const href = unlocked
              ? ({ pathname: '/lesson/[id]', params: { id: item.id } } as const)
              : ('/paywall' as const);
            return (
              <Link href={href} asChild>
                <Pressable style={({ pressed }) => pressed && styles.pressed}>{card}</Pressable>
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
  status: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  order: {
    fontSize: 13,
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
