import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDefaultPack, getDomain, lessonsByDomain } from '@/content';
import { useStrings } from '@/i18n/strings';

export default function DomainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useStrings();
  const pack = getDefaultPack();
  const domain = id ? getDomain(pack, id) : undefined;

  if (!domain) {
    return null;
  }

  const lessons = lessonsByDomain(pack, domain.id);

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
          renderItem={({ item }) => (
            // TODO(M3) : ouvrir la leçon (rendu des blocks + quickcheck)
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText>{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.estMinutes} {t.domain.minutes} · {t.domain.lessonSoon}
              </ThemedText>
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
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
});
