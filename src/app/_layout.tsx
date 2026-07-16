import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { activeProvider } from '@/features/monetization';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void activeProvider.init();
  }, []);
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
