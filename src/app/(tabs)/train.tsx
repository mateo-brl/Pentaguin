import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function TrainScreen() {
  const t = useStrings();
  const theme = useTheme();

  const items = [
    {
      key: 'quiz',
      icon: 'help-circle-outline' as const,
      title: t.train.quiz,
      desc: t.train.quizDesc,
      href: '/quiz/setup' as const,
    },
    {
      key: 'exam',
      icon: 'timer-outline' as const,
      title: t.train.exam,
      desc: t.train.examDesc,
      href: '/exam' as const,
    },
    {
      key: 'mistakes',
      icon: 'refresh-outline' as const,
      title: t.train.mistakes,
      desc: t.train.mistakesDesc,
      href: '/mistakes' as const,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">{t.tabs.train}</ThemedText>
        </View>
        {items.map((item) => (
          <Link key={item.key} href={item.href} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.card}>
                <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon} size={22} color={theme.accent} />
                </View>
                <View style={styles.body}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.desc}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
