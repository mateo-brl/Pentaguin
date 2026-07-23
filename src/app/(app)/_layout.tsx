import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

// Toute l'app « déverrouillée » vit dans ce groupe. La garde de session
// (src/app/_layout.tsx) ne monte ce groupe que lorsqu'un compte est connecté
// ET qu'un pseudo a été choisi — voir src/features/account/session.tsx.
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // En-têtes natifs et fond de scène au thème de l'app (sinon barre
        // blanche + chevron bleu iOS + flash blanc en mode sombre).
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.accent,
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        // Chevron seul (sinon iOS affiche le nom du groupe parent, ex. « (tabs) »).
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
