import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankBadge } from '@/components/ui/rank-badge';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDefaultPack, lessonsByDomain } from '@/content';
import { getCompletedLessonIds } from '@/db/repositories';
import { isLessonUnlockedNow, useEntitlements } from '@/features/monetization';
import { recommendedLessons } from '@/features/rank/recommend';
import { useRank } from '@/features/rank/ranks';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();

export default function LearnScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const rank = useRank();
  const entitlements = useEntitlements();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);
  const domainIndex = new Map(domains.map((d, i) => [d.id, i]));

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      setCompleted(getCompletedLessonIds(pack.id));
    }, []),
  );

  // Positionnement obligatoire avant d'accéder au contenu.
  if (rank == null) return <Redirect href="/placement" />;

  // Recommandations à ton rang, en excluant ce que tu as déjà terminé.
  const recommended = recommendedLessons(pack, rank, { exclude: completed });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {t.tabs.learn}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.learn.tagline}
            </ThemedText>
          </View>

          {domains.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {t.learn.empty}
            </ThemedText>
          ) : (
            <>
              {recommended.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <ThemedText type="smallBold" style={styles.sectionTitle}>
                      {t.learn.forYourRank}
                    </ThemedText>
                    <RankBadge rankId={rank} compact />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSub}>
                    {t.learn.forYourRankSub}
                  </ThemedText>
                  <RowGroup>
                    {recommended.map((lesson, index) => {
                      const di = domainIndex.get(lesson.domainId) ?? 0;
                      const hue = hueFor(di);
                      const domain = domains[di];
                      const unlocked = isLessonUnlockedNow(lesson, entitlements);
                      return (
                        <Row
                          key={lesson.id}
                          first={index === 0}
                          dimmed={!unlocked}
                          title={lesson.title}
                          subtitle={`${domain?.title ?? ''} · ${lesson.estMinutes} ${t.domain.minutes}`}
                          leading={
                            <SquareBadge color={hue.base} background={hue.soft}>
                              <Ionicons name="sparkles" size={17} color={hue.base} />
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
                </View>
              )}

              <ThemedText type="smallBold" style={styles.sectionTitle}>
                {t.learn.allThemes}
              </ThemedText>
              <RowGroup>
                {domains.map((domain, index) => {
                  const hue = hueFor(index);
                  const lessonCount = lessonsByDomain(pack, domain.id).length;
                  return (
                    <Row
                      key={domain.id}
                      first={index === 0}
                      title={domain.title}
                      subtitle={`${lessonCount} ${t.learn.lessonsCount}`}
                      leading={
                        <SquareBadge color={hue.base} background={hue.soft}>
                          {domain.code}
                        </SquareBadge>
                      }
                      onPress={() =>
                        router.push({ pathname: '/domain/[id]', params: { id: domain.id } })
                      }
                    />
                  );
                })}
              </RowGroup>
            </>
          )}
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
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.one,
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
  },
  sectionSub: {
    marginTop: -Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  empty: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
});
