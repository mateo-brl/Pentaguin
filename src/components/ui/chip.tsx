import { Pressable, StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
