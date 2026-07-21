import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { activeProvider } from '@/features/monetization';
import { SessionProvider, useSession } from '@/features/account/session';
import { useHasSeenOnboarding } from '@/features/settings/first-run';
import { useHasChosenLocale } from '@/features/settings/locale-choice';
import { initThemeMode } from '@/features/settings/theme-mode';
import { ErrorBoundary } from '@/features/telemetry/error-boundary';
import { installErrorReporter } from '@/features/telemetry/report';
import { ToastProvider } from '@/features/toast/toast';
import { initLocale } from '@/i18n/strings';

// Garde d'entrée : tant qu'aucun compte n'est connecté, seul l'écran de
// connexion est monté ; après connexion mais avant le choix du pseudo, seul
// l'écran de pseudo l'est ; ensuite seulement le groupe (app) — donc toute
// l'app — devient accessible. Les redirections sont gérées par expo-router
// dès que la garde change (Stack.Protected, SDK 57).
function RootNavigator() {
  const { status } = useSession();
  const onboardingSeen = useHasSeenOnboarding();
  const localeChosen = useHasChosenLocale();

  // status 'loading' : le splash natif reste affiché (voir SessionProvider).
  if (status === 'loading') return null;

  const signedOut = status === 'signedOut';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsPseudo'}>
        <Stack.Screen name="choose-pseudo" />
      </Stack.Protected>
      {/* Tout premier écran de l'app : la langue, avant même l'onboarding. */}
      <Stack.Protected guard={signedOut && !localeChosen}>
        <Stack.Screen name="choose-language" />
      </Stack.Protected>
      <Stack.Protected guard={signedOut && localeChosen && !onboardingSeen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedOut && localeChosen && onboardingSeen}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Lecture des préférences persistantes + capteur d'erreurs avant le 1er rendu.
  useState(() => {
    initLocale();
    initThemeMode();
    installErrorReporter();
    return true;
  });

  useEffect(() => {
    void activeProvider.init();
  }, []);

  return (
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
