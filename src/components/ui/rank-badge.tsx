import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { penguinHeadSvg } from '@/components/mascot/penguin-art';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/theme';
import { rankById } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings, type Strings } from '@/i18n/strings';

/** Libellé lisible d'un rang, ex. « Bronze III », « Diamant », « Empereur ». */
export function rankLabel(rankId: number, t: Strings): string {
  const rank = rankById(rankId);
  const league = t.ranks[rank.league];
  return rank.tier ? `${league} ${rank.tier}` : league;
}

/** Pilule compacte : listes, en-têtes, classement. */
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

/**
 * Écusson hexagonal (habillage 3b de la refonte) : le rang porté comme un
 * blason. Les paliers affichent leur chiffre romain, les trois rangs d'élite
 * (Diamant, Maître, Empereur) affichent la tête du manchot.
 */
export function RankCrest({ rankId, size = 96 }: { rankId: number; size?: number }) {
  const rank = rankById(rankId);
  const glyph = rank.tier || null;

  // Hexagone pointe en haut, tracé dans un viewBox carré.
  const hex =
    `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M60 4 L110 32 L110 88 L60 116 L10 88 L10 32 Z" fill="${rank.color}22" stroke="${rank.color}" stroke-width="4" stroke-linejoin="round"/>` +
    `</svg>`;

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image">
      <SvgXml xml={hex} width="100%" height="100%" />
      <View style={StyleSheet.absoluteFill}>
        {glyph ? (
          <View style={styles.crestInner}>
            <ThemedText type="mono" style={{ color: rank.color, fontSize: size * 0.3 }}>
              {glyph}
            </ThemedText>
          </View>
        ) : (
          <SvgXml xml={penguinHeadSvg} width="100%" height="100%" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  crestInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
