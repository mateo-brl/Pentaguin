import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { installCloudSave, pullMergeProgress } from '@/features/sync/cloud-save';
import { useTheme } from '@/hooks/use-theme';

// Toute l'app « déverrouillée » vit dans ce groupe. La garde de session
// (src/app/_layout.tsx) ne monte ce groupe que lorsqu'un compte est connecté
// ET qu'un pseudo a été choisi — voir src/features/account/session.tsx.
export default function AppLayout() {
  const theme = useTheme();

  // Compte connecté : on restaure la progression depuis le serveur (utile après
  // une réinstallation ou sur un nouvel appareil), puis on sauvegarde à chaque
  // passage en arrière-plan. Tout est non bloquant et offline-first.
  useEffect(() => {
    void pullMergeProgress();
    return installCloudSave();
  }, []);

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
