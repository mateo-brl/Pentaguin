import { StyleSheet, View, type DimensionValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Progression entre 0 et 1. */
  value: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ value, color, height = 6 }: Props) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={[styles.track, { backgroundColor: theme.backgroundSelected, height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct}%` as DimensionValue,
          backgroundColor: color ?? theme.accent,
          height: '100%',
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
});
