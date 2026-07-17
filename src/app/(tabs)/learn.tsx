import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack, lessonsByDomain } from '@/content';
import { useHues } from '@/hooks/use-hues';
import { useStrings } from '@/i18n/strings';

export default function LearnScreen() {
  const t = useStrings();
  const { hueFor } = useHues();
  const pack = getDefaultPack();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {t.tabs.learn}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {pack.certName} {pack.examCode}
            </ThemedText>
          </View>

          <RowGroup>
            {domains.map((domain, index) => {
              const hue = hueFor(index);
              const lessonCount = lessonsByDomain(pack, domain.id).length;
              return (
                <Row
                  key={domain.id}
                  first={index === 0}
                  title={domain.title}
                  subtitle={`${lessonCount} ${t.learn.lessons} · ${domain.weightPercent} % ${t.learn.examWeight}`}
                  leading={
                    <SquareBadge color={hue.base} background={hue.soft}>
                      {domain.code}
                    </SquareBadge>
                  }
                  onPress={() => router.push({ pathname: '/domain/[id]', params: { id: domain.id } })}
                />
              );
            })}
          </RowGroup>
        </ScrollView>
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
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
});
