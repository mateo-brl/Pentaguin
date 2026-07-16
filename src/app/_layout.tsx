import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const base = dark ? DarkTheme : DefaultTheme;
  const palette = dark ? Colors.dark : Colors.light;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: palette.accent,
          background: palette.background,
          card: palette.background,
          text: palette.text,
        },
      }}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
