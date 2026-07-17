import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
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
      <Stack.Screen options={{ headerShown: true, title: `${domain.code} · ${domain.title}` }} />
      {lessons.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          {t.domain.empty}
        </ThemedText>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <RowGroup>
            {lessons.map((lesson, index) => {
              const isDone = completed.has(lesson.id);
              return (
                <Row
                  key={lesson.id}
                  first={index === 0}
                  dimmed={!unlocked}
                  title={lesson.title}
                  subtitle={unlocked ? `${lesson.estMinutes} ${t.domain.minutes}` : t.lesson.locked}
                  leading={
                    <SquareBadge
                      color={isDone ? theme.success : theme.textSecondary}
                      background={isDone ? theme.successSoft : theme.backgroundSelected}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={18} color={theme.success} />
                      ) : (
                        String(lesson.order)
                      )}
                    </SquareBadge>
                  }
                  trailing={
                    unlocked ? undefined : (
                      <Ionicons name="lock-closed" size={15} color={theme.textSecondary} />
                    )
                  }
                  onPress={() =>
                    unlocked
                      ? router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })
                      : router.push('/paywall')
                  }
                />
              );
            })}
          </RowGroup>
        </ScrollView>
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
  content: {
    padding: Spacing.four,
  },
});
