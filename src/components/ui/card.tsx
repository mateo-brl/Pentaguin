import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Bordure accentuée (élément sélectionné / mis en avant). */
  selected?: boolean;
  /** Variante de fond : 'soft' pour un aplat teinté (successSoft…). */
  background?: string;
  style?: StyleProp<ViewStyle>;
};

/** Surface bordée standard de l'app — remplace les blocs plats. */
export function Card({ children, onPress, disabled, selected, background, style }: Props) {
  const theme = useTheme();
  const surface = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: background ?? theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return surface;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      {surface}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
