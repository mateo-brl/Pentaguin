import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack, lessonsByDomain } from '@/content';
import { useStrings } from '@/i18n/strings';

export default function LearnScreen() {
  const t = useStrings();
  const pack = getDefaultPack();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          {pack.certName} · {pack.examCode}
        </ThemedText>
        <FlatList
          data={domains}
          keyExtractor={(domain) => domain.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const lessonCount = lessonsByDomain(pack, item.id).length;
            return (
              <Link href={{ pathname: '/domain/[id]', params: { id: item.id } }} asChild>
                <Pressable>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText type="smallBold" themeColor="accent">
                      {item.code}
                    </ThemedText>
                    <ThemedText>{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {lessonCount} {t.learn.lessons} · {item.weightPercent} % {t.learn.examWeight}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
});
