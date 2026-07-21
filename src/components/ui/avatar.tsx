import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { penguinAvatarSvg } from '@/components/mascot/penguin-art';
import { FontFamily } from '@/theme';
import { useHues } from '@/hooks/use-hues';

import { initials, ioniconFor, type AvatarSpec } from '@/features/account/avatar';

type Props = {
  spec: AvatarSpec;
  pseudo: string;
  size?: number;
};

/** Pastille d'avatar : manchot, icône Ionicons ou initiales sur fond teinté. */
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
      {spec.icon === 'penguin' ? (
        <SvgXml xml={penguinAvatarSvg} width={size} height={size} />
      ) : icon ? (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size * 0.5} color={hue.base} />
      ) : (
        <Text style={{ color: hue.base, fontSize: size * 0.38, fontFamily: FontFamily.bold }}>
          {initials(pseudo)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
