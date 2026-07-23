import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Fondu vers le fond, posé sur le bas du contenu précédent (marginTop négatif) :
 * suggère « il y a plus en dessous ». Purement décoratif, non tactile.
 */
export function FadeOut({ color, height = 64 }: { color: string; height?: number }) {
  return (
    <View style={{ height, marginTop: -height }} pointerEvents="none">
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id="fadeout" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={height} fill="url(#fadeout)" />
      </Svg>
    </View>
  );
}
