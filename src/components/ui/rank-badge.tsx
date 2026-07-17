import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { rankById } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings, type Strings } from '@/i18n/strings';

/** Libellé lisible d'un rang, ex. « Bronze III », « Diamant », « Empereur ». */
export function rankLabel(rankId: number, t: Strings): string {
  const rank = rankById(rankId);
  const league = t.ranks[rank.league];
  return rank.tier ? `${league} ${rank.tier}` : league;
}

export function RankBadge({ rankId, compact }: { rankId: number; compact?: boolean }) {
  const theme = useTheme();
  const t = useStrings();
  const rank = rankById(rankId);

  return (
    <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
      <Ionicons name="medal" size={compact ? 14 : 17} color={rank.color} />
      <ThemedText type="smallBold" style={{ color: rank.color, fontSize: compact ? 12 : 14 }}>
        {rankLabel(rankId, t)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
