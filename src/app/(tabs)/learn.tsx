import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack, lessonsByDomain } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function LearnScreen() {
  const t = useStrings();
  const theme = useTheme();
  const pack = getDefaultPack();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">{t.tabs.learn}</ThemedText>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.packMeta}>
            {pack.certName} · {pack.examCode}
          </ThemedText>
        </View>
        <FlatList
          data={domains}
          keyExtractor={(domain) => domain.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const lessonCount = lessonsByDomain(pack, item.id).length;
            return (
              <Link href={{ pathname: '/domain/[id]', params: { id: item.id } }} asChild>
                <Pressable style={({ pressed }) => pressed && styles.pressed}>
                  <Card style={styles.card}>
                    <View style={[styles.codeBadge, { backgroundColor: theme.accentSoft }]}>
                      <ThemedText type="mono" themeColor="accent" style={styles.codeText}>
                        {item.code}
                      </ThemedText>
                    </View>
                    <View style={styles.body}>
                      <ThemedText type="smallBold">{item.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {lessonCount} {t.learn.lessons} · {item.weightPercent} % {t.learn.examWeight}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </Card>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  packMeta: {
    fontSize: 13,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  codeBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeText: {
    fontSize: 13,
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
