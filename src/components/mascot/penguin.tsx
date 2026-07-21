import { useEffect, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Duration, Motion, RewardOvershoot } from '@/constants/motion';

import {
  flameSvg,
  penguinSvg,
  type PenguinAccessory,
  type PenguinFinish,
  type PenguinState,
} from './penguin-art';

type Props = {
  /** Expression : c'est elle qui porte l'émotion du moment. */
  state?: PenguinState;
  accessory?: PenguinAccessory | null;
  finish?: PenguinFinish;
  size?: number;
  /**
   * Animation d'entrée :
   * - `pop` : dépassement léger puis repos — pour les récompenses (rang, succès).
   * - `float` : respiration lente en boucle — pour les états d'attente.
   * - `none` : statique.
   */
  animation?: 'pop' | 'float' | 'none';
  style?: StyleProp<ViewStyle>;
};

const RATIO = 240 / 200;

export function Penguin({
  state = 'neutral',
  accessory = null,
  finish = 'flat',
  size = 140,
  animation = 'none',
  style,
}: Props) {
  const xml = penguinSvg(state, { finish, accessory });
  const [scale] = useState(() => new Animated.Value(animation === 'pop' ? 0.6 : 1));
  const [opacity] = useState(() => new Animated.Value(animation === 'pop' ? 0 : 1));
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (animation === 'pop') {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: Duration.celebration,
          easing: Motion.reward,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: Duration.ui,
          easing: Motion.standard,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    if (animation === 'float') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 1300,
            easing: Motion.standard,
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 1300,
            easing: Motion.standard,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [animation, scale, opacity, float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <Animated.View
      accessibilityRole="image"
      style={[{ width: size, height: size * RATIO, transform: [{ scale }, { translateY }], opacity }, style]}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </Animated.View>
  );
}

/** Flamme de série — boucle linéaire, la seule animation continue autorisée. */
export function StreakFlame({ size = 28 }: { size?: number }) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, easing: Motion.loop, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 500, easing: Motion.loop, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, RewardOvershoot] });

  return (
    <Animated.View style={{ width: size, height: size * (92 / 70), transform: [{ scale }] }}>
      <SvgXml xml={flameSvg} width="100%" height="100%" />
    </Animated.View>
  );
}

/** Enveloppe neutre quand on veut juste réserver la place du manchot. */
export function PenguinSlot({ size = 140 }: { size?: number }) {
  return <View style={{ width: size, height: size * RATIO }} />;
}
