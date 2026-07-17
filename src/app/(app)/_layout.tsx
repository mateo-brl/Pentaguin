import { Stack } from 'expo-router';

// Toute l'app « déverrouillée » vit dans ce groupe. La garde de session
// (src/app/_layout.tsx) ne monte ce groupe que lorsqu'un compte est connecté
// ET qu'un pseudo a été choisi — voir src/features/account/session.tsx.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
