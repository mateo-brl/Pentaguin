import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, MaxContentWidth, Spacing, domainColor } from '@/theme';
import { useRank } from '@/features/rank/ranks';
import { useStrings } from '@/i18n/strings';

export default function TrainScreen() {
  const t = useStrings();
  const rank = useRank();

  // Positionnement obligatoire avant de s'entraîner.
  if (rank == null) return <Redirect href="/placement" />;

  const items = [
    {
      key: 'practice',
      icon: 'flask' as const,
      title: t.train.practice,
      desc: t.train.practiceDesc,
      href: '/practice' as const,
    },
    {
      key: 'quiz',
      icon: 'help' as const,
      title: t.train.quiz,
      desc: t.train.quizDesc,
      href: '/quiz/setup' as const,
    },
    {
      key: 'exam',
      icon: 'timer' as const,
      title: t.train.exam,
      desc: t.train.examDesc,
      href: '/exam' as const,
    },
    {
      key: 'mistakes',
      icon: 'refresh' as const,
      title: t.train.mistakes,
      desc: t.train.mistakesDesc,
      href: '/mistakes' as const,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t.tabs.train}
          </ThemedText>
        </View>
        <RowGroup>
          {items.map((item, index) => {
            const hue = domainColor(index);
            return (
              <Row
                key={item.key}
                first={index === 0}
                title={item.title}
                subtitle={item.desc}
                leading={
                  <SquareBadge color={hue.base} background={hue.soft}>
                    <Ionicons name={item.icon} size={20} color={hue.base} />
                  </SquareBadge>
                }
                onPress={() => router.push(item.href)}
              />
            );
          })}
        </RowGroup>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.base,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
});
