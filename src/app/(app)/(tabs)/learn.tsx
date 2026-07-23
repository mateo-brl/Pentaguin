import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { rankLabel } from '@/components/ui/rank-badge';
import { Row, RowGroup, SquareBadge } from '@/components/ui/row';
import { BottomTabInset, domainColor, MaxContentWidth, Radius, Spacing } from '@/theme';
import { DEFAULT_PACK_ID, getDefaultPack, lessonsByDomain, type Lesson } from '@/content';
import { getCompletedLessonIds } from '@/db/repositories';
import { isLessonUnlockedNow, useEntitlements } from '@/features/monetization';
import { recommendedLessons } from '@/features/rank/recommend';
import { useRank } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/** Accroche d'une leçon : première phrase de son premier bloc de texte. */
function lessonTeaser(lesson: Lesson): string | null {
  const block = lesson.blocks.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') return null;
  const plain = block.md.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
  const sentence = plain.split(/(?<=[.!?])\s/)[0] ?? plain;
  return sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence;
}

export default function LearnScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const rank = useRank();
  const entitlements = useEntitlements();
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);
  const domainIndex = new Map(domains.map((d, i) => [d.id, i]));

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      setCompleted(getCompletedLessonIds(DEFAULT_PACK_ID));
    }, []),
  );

  // Positionnement obligatoire avant d'accéder au contenu.
  if (rank == null) return <Redirect href="/placement" />;

  const recommended = recommendedLessons(pack, rank, { exclude: completed, limit: 4 });
  const [hero, ...rest] = recommended;
  const heroDomain = hero ? domains[domainIndex.get(hero.domainId) ?? 0] : undefined;
  const heroHue = domainColor(hero ? (domainIndex.get(hero.domainId) ?? 0) : 0);
  const heroUnlocked = hero ? isLessonUnlockedNow(hero, entitlements) : false;
  const teaser = hero ? lessonTeaser(hero) : null;

  // Toujours ouvrir la leçon : si elle est Pro, l'écran leçon affiche un aperçu
  // « eau à la bouche » puis l'invitation (plus de mur vers le paywall à froid).
  const openLesson = (lesson: Lesson) =>
    router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {t.tabs.learn}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.learn.tagline}
            </ThemedText>
          </View>

          {hero && heroDomain ? (
            <>
              {/* Carte héros : la leçon à faire maintenant, mise en scène. */}
              <Pressable
                onPress={() => openLesson(hero)}
                style={({ pressed }) => [
                  styles.heroCard,
                  { borderColor: heroHue.base, backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.heroTop}>
                  <ThemedText type="label" style={{ color: heroHue.base }}>
                    {t.learn.forYourRank} · {rankLabel(rank, t)}
                  </ThemedText>
                  {!heroUnlocked && (
                    <Ionicons name="lock-closed" size={14} color={theme.textSecondary} />
                  )}
                </View>

                <ThemedText type="label" themeColor="textSecondary">
                  {heroDomain.title} · {t.learn.levelShort}
                  {hero.level}
                </ThemedText>
                <ThemedText type="subtitle">{hero.title}</ThemedText>
                {teaser && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {teaser}
                  </ThemedText>
                )}

                <View style={styles.heroFoot}>
                  <ThemedText type="label" themeColor="textSecondary">
                    {hero.estMinutes} {t.domain.minutes}
                  </ThemedText>
                  {/* CTA principal : TOUJOURS ambre. Le bleu de domaine ne colore
                      qu'une identité (bordure/pastille), jamais un bouton d'action. */}
                  <View style={[styles.startPill, { backgroundColor: theme.accent }]}>
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      {t.learn.start} →
                    </ThemedText>
                  </View>
                </View>
              </Pressable>

              {/* Les suivantes, en liste compacte. */}
              {rest.length > 0 && (
                <RowGroup>
                  {rest.map((lesson, index) => {
                    const di = domainIndex.get(lesson.domainId) ?? 0;
                    const hue = domainColor(di);
                    const unlocked = isLessonUnlockedNow(lesson, entitlements);
                    return (
                      <Row
                        key={lesson.id}
                        first={index === 0}
                        dimmed={!unlocked}
                        title={lesson.title}
                        subtitle={`${domains[di]?.title ?? ''} · ${t.learn.levelShort}${lesson.level} · ${lesson.estMinutes} ${t.domain.minutes}`}
                        leading={
                          <SquareBadge color={hue.base} background={hue.soft}>
                            {lesson.level}
                          </SquareBadge>
                        }
                        trailing={
                          unlocked ? undefined : (
                            <Ionicons name="lock-closed" size={15} color={theme.textSecondary} />
                          )
                        }
                        onPress={() => openLesson(lesson)}
                      />
                    );
                  })}
                </RowGroup>
              )}
            </>
          ) : (
            <View style={[styles.caughtUp, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">{t.home.allCaughtUp}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.home.allCaughtUpDesc}
              </ThemedText>
            </View>
          )}

          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
            {t.learn.allThemes}
          </ThemedText>
          <RowGroup>
            {domains.map((domain, index) => {
              const hue = domainColor(index);
              const lessons = lessonsByDomain(pack, domain.id);
              const done = lessons.filter((l) => completed.has(l.id)).length;
              const unlockedCount = lessons.filter((l) => isLessonUnlockedNow(l, entitlements)).length;
              const isPro = unlockedCount < lessons.length;
              return (
                <Row
                  key={domain.id}
                  first={index === 0}
                  title={domain.title}
                  subtitle={`${lessons.length} ${lessons.length > 1 ? t.learn.lessonsPlural : t.learn.lessonsSingular}`}
                  leading={
                    <SquareBadge color={hue.base} background={hue.soft}>
                      {domain.code.replace('.0', '')}
                    </SquareBadge>
                  }
                  trailing={
                    isPro ? (
                      <View style={[styles.proChip, { backgroundColor: theme.accentSoft }]}>
                        <ThemedText type="label" style={{ color: theme.accent }}>
                          Pro
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText type="mono" themeColor="textSecondary" style={styles.progress}>
                        {done}/{lessons.length}
                      </ThemedText>
                    )
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
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: BottomTabInset + Spacing.base,
    gap: Spacing.base,
  },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.xs, gap: Spacing.xs },
  title: { fontSize: 28, lineHeight: 34 },
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  startPill: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  caughtUp: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.base, gap: Spacing.xs },
  sectionLabel: { marginTop: Spacing.sm },
  proChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  progress: { fontSize: 13 },
});
