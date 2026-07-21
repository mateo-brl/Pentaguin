import { useFonts } from 'expo-font';
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

  // Polices chargées à l'EXÉCUTION : elles voyagent comme des assets d'EAS
  // Update, donc modifiables en OTA sans rebuild natif. On ne rend rien tant
  // qu'elles ne sont pas prêtes (le splash natif reste affiché) — sinon un
  // premier rendu en police système « flasherait ».
  const [fontsLoaded] = useFonts({
    'HankenGrotesk-Regular': require('../../assets/fonts/HankenGrotesk-Regular.ttf'),
    'HankenGrotesk-Medium': require('../../assets/fonts/HankenGrotesk-Medium.ttf'),
    'HankenGrotesk-SemiBold': require('../../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    'HankenGrotesk-Bold': require('../../assets/fonts/HankenGrotesk-Bold.ttf'),
    'JetBrainsMono-Regular': require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  useEffect(() => {
    void activeProvider.init();
  }, []);

  if (!fontsLoaded) return null;

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
