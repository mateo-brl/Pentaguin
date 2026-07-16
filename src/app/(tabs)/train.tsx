import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function TrainScreen() {
  const t = useStrings();
  const theme = useTheme();

  // TODO(M3/M4) : brancher quiz, examen blanc et revue d'erreurs.
  const items = [
    { key: 'quiz', title: t.train.quiz, desc: t.train.quizDesc },
    { key: 'exam', title: t.train.exam, desc: t.train.examDesc },
    { key: 'mistakes', title: t.train.mistakes, desc: t.train.mistakesDesc },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          {t.tabs.train}
        </ThemedText>
        {items.map((item) => (
          <ThemedView key={item.key} type="backgroundElement" style={styles.card}>
            <ThemedView type="backgroundElement" style={styles.cardHeader}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText
                type="small"
                style={[styles.chip, { backgroundColor: theme.accentSoft, color: theme.accent }]}>
                {t.train.comingSoon}
              </ThemedText>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {item.desc}
            </ThemedText>
          </ThemedView>
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
