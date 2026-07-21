import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankCrest, rankLabel } from '@/components/ui/rank-badge';
import { MaxContentWidth, Radius, Spacing } from '@/theme';
import { getTotalXp } from '@/db/repositories';
import { MAX_RANK, RANKS, useRank } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/**
 * « Ta progression » (écran 4f de la refonte) : le rang courant mis en scène,
 * puis l'échelle complète des 15 rangs. Les rangs au-delà du tien sont estompés
 * — on montre le chemin sans le déguiser en barre de progression factice (le
 * rang vient du test de positionnement, pas d'un cumul d'XP).
 */
export default function RanksScreen() {
  const t = useStrings();
  const theme = useTheme();
  const rank = useRank();
  const [totalXp, setTotalXp] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTotalXp(getTotalXp());
    }, []),
  );

  const current = rank ?? 1;
  const currentRank = RANKS[current - 1];
  const next = current < MAX_RANK ? RANKS[current] : null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.ranksScreen.title }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rang courant : l'écusson en grand, la donnée en mono. */}
        <View style={[styles.hero, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <RankCrest rankId={current} size={116} />
          <View style={styles.heroText}>
            <ThemedText type="title" style={{ color: currentRank.color, fontSize: 26, lineHeight: 32 }}>
              {rankLabel(current, t)}
            </ThemedText>
            <ThemedText type="label" themeColor="textSecondary">
              {t.ranksScreen.position.replace('{n}', String(current)).replace('{max}', String(MAX_RANK))}
            </ThemedText>
            {next && (
              <ThemedText type="small" themeColor="textSecondary">
                {t.ranksScreen.next} {rankLabel(current + 1, t)}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={[styles.xpTile, { backgroundColor: theme.accentSoft }]}>
          <ThemedText type="label" style={{ color: theme.accent }}>
            {t.profile.xpTotal}
          </ThemedText>
          <ThemedText type="stat" style={{ color: theme.accent, fontSize: 34, lineHeight: 40 }}>
            {totalXp}
          </ThemedText>
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
          {t.ranksScreen.scale}
        </ThemedText>

        {/* L'échelle : 15 écussons, le tien en pleine lumière. */}
        <View style={styles.ladder}>
          {RANKS.map((r) => {
            const isCurrent = r.id === current;
            const reached = r.id <= current;
            return (
              <View
                key={r.id}
                style={[
                  styles.ladderItem,
                  { opacity: reached ? 1 : 0.34 },
                  isCurrent && [styles.ladderCurrent, { borderColor: r.color }],
                ]}>
                <RankCrest rankId={r.id} size={54} />
                <ThemedText
                  type="label"
                  style={{ color: isCurrent ? r.color : theme.textSecondary, fontSize: 9 }}
                  numberOfLines={1}>
                  {r.tier ? `${t.ranks[r.league]} ${r.tier}` : t.ranks[r.league]}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.base,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
  },
  heroText: { flex: 1, gap: Spacing.xs },
  xpTile: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  sectionLabel: { marginTop: Spacing.sm },
  ladder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  ladderItem: {
    width: '18%',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  ladderCurrent: { borderWidth: 1.5 },
});
