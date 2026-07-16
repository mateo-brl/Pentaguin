import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { activeProvider } from '@/features/monetization';

export default function RootLayout() {
  useEffect(() => {
    void activeProvider.init();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
