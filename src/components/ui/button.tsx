import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const EDGE = 4;
const FACE = 52;

/**
 * Bouton « tactile » signature de l'app : face pleine posée sur une tranche
 * plus sombre, qui s'enfonce à l'appui. (variant ghost = lien discret, plat.)
 */
export function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  const theme = useTheme();

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }, disabled && styles.disabled, style]}>
        <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 15 }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  const palette: Record<Exclude<Variant, 'ghost'>, { face: string; edge: string; color: string; borderColor?: string }> = {
    primary: { face: theme.accent, edge: theme.accentDark, color: theme.onAccent },
    secondary: {
      face: theme.backgroundElement,
      edge: theme.border,
      color: theme.text,
      borderColor: theme.border,
    },
    danger: { face: theme.dangerSoft, edge: theme.dangerDark, color: theme.danger },
  };
  const colors = palette[variant];

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.container, disabled && styles.disabled, style]}>
      {({ pressed }) => (
        <View style={styles.inner}>
          <View style={[styles.edge, { backgroundColor: colors.edge }]} />
          <View
            style={[
              styles.face,
              {
                backgroundColor: colors.face,
                top: pressed ? EDGE : 0,
                borderWidth: colors.borderColor ? 2 : 0,
                borderColor: colors.borderColor,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: colors.color, fontSize: 15, letterSpacing: 0.3 }}>
              {label}
            </ThemedText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: FACE + EDGE,
  },
  inner: {
    flex: 1,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: EDGE,
    bottom: 0,
    borderRadius: 16,
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: FACE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ghost: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
