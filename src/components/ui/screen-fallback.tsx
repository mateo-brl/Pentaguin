import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/theme';
import { useStrings } from '@/i18n/strings';

/**
 * Écran de repli quand une route dynamique n'a pas de contenu (id inconnu :
 * deep-link, restauration d'état, ou id renommé par une OTA). Fournit un
 * en-tête + un bouton retour — sinon l'utilisateur reste sur un écran vide
 * sans moyen de revenir (le Stack a headerShown:false par défaut).
 */
export function ScreenFallback({ title }: { title?: string }) {
  const t = useStrings();
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: title ?? t.common.notFoundTitle }} />
      <View style={styles.body}>
        <ThemedText type="subtitle" style={styles.text}>
          {t.common.notFoundTitle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
          {t.common.notFoundBody}
        </ThemedText>
        <Button label={t.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base, padding: Spacing.lg },
  text: { textAlign: 'center' },
});
