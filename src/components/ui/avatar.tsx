import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useHues } from '@/hooks/use-hues';

import { initials, ioniconFor, type AvatarSpec } from '@/features/account/avatar';

type Props = {
  spec: AvatarSpec;
  pseudo: string;
  size?: number;
};

/** Pastille d'avatar : icône Ionicons ou initiales sur fond teinté. */
export function Avatar({ spec, pseudo, size = 44 }: Props) {
  const { hueFor } = useHues();
  const hue = hueFor(spec.color);
  const icon = ioniconFor(spec.icon);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hue.soft },
      ]}>
      {icon ? (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size * 0.5} color={hue.base} />
      ) : (
        <Text style={{ color: hue.base, fontSize: size * 0.38, fontWeight: '700' }}>
          {initials(pseudo)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
