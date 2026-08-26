import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/theme';
import { useStrings } from '@/i18n/strings';

/**
 * Invitation à passer le test de positionnement, affichée à la place du contenu
 * tant qu'aucun rang n'est établi.
 *
 * Remplace un `<Redirect href="/placement" />` qui posait deux problèmes : il
 * remplaçait la route `(tabs)` entière, donc la barre d'onglets disparaissait et
 * le test devenait un cul-de-sac sans retour ; et l'utilisateur était éjecté
 * d'un onglet vers un questionnaire de 20 questions sans avoir rien demandé.
 *
 * Ici, l'écran reste dans l'onglet, explique ce qui se passe, et c'est un appui
 * volontaire qui lance le test — que l'on peut donc quitter par le chevron.
 */
export function PlacementGate() {
  const t = useStrings();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Penguin state="focus" size={132} animation="float" />
        <ThemedText type="title" style={styles.center}>
          {t.placement.gateTitle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {t.placement.gateBody}
        </ThemedText>
      </View>
      <Button label={t.placement.start} onPress={() => router.push('/placement')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  center: {
    textAlign: 'center',
  },
});
