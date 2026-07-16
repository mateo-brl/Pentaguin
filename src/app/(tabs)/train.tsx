import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStrings } from '@/i18n/strings';

export default function TrainScreen() {
  const t = useStrings();

  const items = [
    { key: 'quiz', title: t.train.quiz, desc: t.train.quizDesc, href: '/quiz/setup' as const },
    { key: 'exam', title: t.train.exam, desc: t.train.examDesc, href: '/exam' as const },
    {
      key: 'mistakes',
      title: t.train.mistakes,
      desc: t.train.mistakesDesc,
      href: '/mistakes' as const,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          {t.tabs.train}
        </ThemedText>
        {items.map((item) => (
          <Link key={item.key} href={item.href} asChild>
            <Pressable>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.desc}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        ))}
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
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    overflow: 'hidden',
  },
});
