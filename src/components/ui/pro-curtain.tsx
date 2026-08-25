import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/**
 * Invitation Pro posée APRÈS un aperçu réel du contenu (jamais un mur sec) :
 * on donne d'abord, on propose ensuite, et la sortie reste à un geste.
 */
export function ProCurtain({ body }: { body: string }) {
  const t = useStrings();
  const theme = useTheme();
  return (
    <View
      style={[styles.curtain, { backgroundColor: theme.backgroundElement, borderColor: theme.accent }]}>
      <Ionicons name="sparkles" size={22} color={theme.accent} />
      <ThemedText type="subtitle" style={styles.center}>
        {t.lesson.previewTitle}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {body}
      </ThemedText>
      <Button label={t.lesson.previewCta} onPress={() => router.push('/paywall')} style={styles.cta} />
      <Button label={t.lesson.previewBack} variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: Spacing.xs },
});
