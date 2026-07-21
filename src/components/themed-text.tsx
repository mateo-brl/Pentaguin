import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'label'
    | 'mono'
    | 'stat'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'label' ? 'textSecondary' : 'text')] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'label' && styles.label,
        type === 'mono' && styles.mono,
        type === 'stat' && styles.stat,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Avec des polices embarquées, on nomme la FACE exacte (pas de `fontWeight` :
// iOS synthétiserait un faux gras au lieu d'utiliser la bonne graisse).
const styles = StyleSheet.create({
  default: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  /** Étiquette de section : mono en capitales espacées — signature de la refonte. */
  label: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  /** Signature « terminal » : codes, méta, rangs. */
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 15,
    lineHeight: 20,
  },
  /** Grande donnée (score, série, XP) : mono, comme le veut la direction. */
  stat: {
    fontFamily: FontFamily.monoBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  link: {
    fontFamily: FontFamily.regular,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: FontFamily.regular,
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
  },
});
