import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { Colors } from '@/theme';
import { SessionProvider, useSession } from '@/features/account/session';
import { activeProvider } from '@/features/monetization';
import { useHasSeenOnboarding } from '@/features/settings/first-run';
import { useHasChosenLocale } from '@/features/settings/locale-choice';
import { initDailyGoal } from '@/features/settings/daily-goal';
import { initThemeMode } from '@/features/settings/theme-mode';
import { ErrorBoundary } from '@/features/telemetry/error-boundary';
import { installErrorReporter, reportError } from '@/features/telemetry/report';
import { ToastProvider } from '@/features/toast/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initLocale } from '@/i18n/strings';

// Garde d'entrée : tant qu'aucun compte n'est connecté, seul l'écran de
// connexion est monté ; après connexion mais avant le choix du pseudo, seul
// l'écran de pseudo l'est ; ensuite seulement le groupe (app) devient
// accessible. Redirections gérées par expo-router (Stack.Protected, SDK 57).
function RootNavigator() {
  const { status } = useSession();
  const onboardingSeen = useHasSeenOnboarding();
  const localeChosen = useHasChosenLocale();
  const scheme = useColorScheme();

  // status 'loading' : le splash natif reste affiché (voir SessionProvider).
  if (status === 'loading') return null;

  const signedOut = status === 'signedOut';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Fond de scène au thème → pas de flash blanc aux transitions en sombre.
        contentStyle: { backgroundColor: Colors[scheme].background },
      }}>
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

/** Barre de statut au thème (heure/batterie lisibles sur fond sombre). */
function ThemedStatusBar() {
  const scheme = useColorScheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  // Lecture des préférences persistantes + capteur d'erreurs avant le 1er rendu.
  // Sous try/catch : cet init touche SQLite ; une base corrompue/pleine ne doit
  // pas crasher AU-DESSUS de l'ErrorBoundary (écran de secours impossible).
  useState(() => {
    try {
      initLocale();
      initThemeMode();
      initDailyGoal();
      installErrorReporter();
    } catch (e) {
      reportError(e, 'init');
    }
    return true;
  });

  // Polices chargées à l'exécution (assets d'EAS Update → modifiables en OTA).
  // On attend leur chargement, MAIS si un asset échoue on rend quand même
  // (police système en repli) plutôt que de rester figé sur le splash.
  const [fontsLoaded, fontError] = useFonts({
    'HankenGrotesk-Regular': require('../../assets/fonts/HankenGrotesk-Regular.ttf'),
    'HankenGrotesk-Medium': require('../../assets/fonts/HankenGrotesk-Medium.ttf'),
    'HankenGrotesk-SemiBold': require('../../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    'HankenGrotesk-Bold': require('../../assets/fonts/HankenGrotesk-Bold.ttf'),
    'JetBrainsMono-Regular': require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) reportError(fontError, 'fonts');
  }, [fontError]);

  useEffect(() => {
    activeProvider.init().catch((e) => reportError(e, 'purchases-init'));
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          <ThemedStatusBar />
          <RootNavigator />
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
