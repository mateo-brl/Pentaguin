import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Radius, Spacing } from '@/theme';

import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & {
  /** Bordure rouge (erreur de validation). */
  invalid?: boolean;
};

export function Input({ invalid, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: invalid ? theme.danger : theme.border,
          color: theme.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    fontSize: 16,
  },
});
