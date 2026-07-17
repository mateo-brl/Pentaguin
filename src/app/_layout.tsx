import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { activeProvider } from '@/features/monetization';
import { SessionProvider, useSession } from '@/features/account/session';

// Garde d'entrée : tant qu'aucun compte n'est connecté, seul l'écran de
// connexion est monté ; après connexion mais avant le choix du pseudo, seul
// l'écran de pseudo l'est ; ensuite seulement le groupe (app) — donc toute
// l'app — devient accessible. Les redirections sont gérées par expo-router
// dès que la garde change (Stack.Protected, SDK 57).
function RootNavigator() {
  const { status } = useSession();

  // status 'loading' : le splash natif reste affiché (voir SessionProvider).
  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsPseudo'}>
        <Stack.Screen name="choose-pseudo" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void activeProvider.init();
  }, []);

  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
