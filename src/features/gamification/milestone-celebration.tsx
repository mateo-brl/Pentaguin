import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/theme';
import { successFeedback } from '@/features/haptics/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

/**
 * Célébration d'un palier de série : le manchot félicite, une fois. Modal léger
 * (pas de dépendance), fond translucide, haptique de succès.
 */
export function MilestoneCelebration({ days, onClose }: { days: number; onClose: () => void }) {
  const t = useStrings();
  const theme = useTheme();

  useEffect(() => {
    successFeedback();
  }, []);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Penguin state="rankup" size={140} animation="pop" />
          <ThemedText type="stat" style={{ color: theme.streak }}>
            {days}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.center}>
            {t.retention.milestoneTitle}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {t.retention.milestoneBody.replace('{days}', String(days))}
          </ThemedText>
          <Button label={t.retention.milestoneCta} onPress={onClose} style={styles.cta} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: Spacing.sm },
});
