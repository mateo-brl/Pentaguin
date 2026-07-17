import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Conteneur de liste groupée : une seule surface, séparateurs fins. */
export function RowGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Pas de séparateur au-dessus (première ligne du groupe). */
  first?: boolean;
  dimmed?: boolean;
};

export function Row({ title, subtitle, leading, trailing, onPress, first, dimmed }: RowProps) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
        dimmed && styles.dimmed,
      ]}>
      {leading}
      <View style={styles.body}>
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle !== undefined && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {trailing ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={17} color={theme.textSecondary} />
        ) : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { backgroundColor: theme.backgroundSelected }}>
      {content}
    </Pressable>
  );
}

/** Pastille carrée colorée (index de domaine, icône de section). */
export function SquareBadge({
  color,
  background,
  children,
}: {
  color: string;
  background: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {typeof children === 'string' ? (
        <ThemedText type="smallBold" style={{ color, fontSize: 15 }}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  dimmed: {
    opacity: 0.55,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
