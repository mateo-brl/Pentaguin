import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { purchasesConfig } from '@/config/monetization';
import { Spacing } from '@/constants/theme';
import { getDefaultPack } from '@/content';
import {
  activeProvider,
  packEntitlement,
  useEntitlements,
  type ProOffer,
} from '@/features/monetization';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const pack = getDefaultPack();
const productId = purchasesConfig.iosProductByPack[pack.id];

function isUserCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'userCancelled' in error &&
    Boolean((error as { userCancelled?: unknown }).userCancelled)
  );
}

/**
 * SEUL écran de vente de l'app (modal). Règles douces : prix affiché d'emblée,
 * fermeture en un geste, pas d'urgence, restore toujours visible (exigence Apple).
 */
export default function PaywallScreen() {
  const t = useStrings();
  const theme = useTheme();
  const entitlements = useEntitlements();
  const isPro = entitlements.has(packEntitlement(pack.id));

  const [offer, setOffer] = useState<ProOffer | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    activeProvider.getProOffer(productId).then((value) => {
      if (mounted) setOffer(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const buy = async () => {
    if (!offer) return;
    setBusy(true);
    try {
      await activeProvider.purchase(offer.productId);
      router.back();
    } catch (error) {
      if (!isUserCancellation(error)) Alert.alert(t.paywall.title, t.paywall.error);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const restored = await activeProvider.restore();
      Alert.alert(
        t.paywall.title,
        restored.size > 0 ? t.paywall.restored : t.paywall.nothingToRestore,
      );
      if (restored.size > 0) router.back();
    } catch {
      Alert.alert(t.paywall.title, t.paywall.error);
    } finally {
      setBusy(false);
    }
  };

  const bullets = [t.paywall.bulletDomains, t.paywall.bulletBank, t.paywall.bulletExams];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={Spacing.two}>
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          {t.paywall.title}
        </ThemedText>

        {isPro ? (
          <Card background={theme.successSoft} style={styles.proBadge}>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              {t.paywall.alreadyPro}
            </ThemedText>
          </Card>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.pitch}>
              {t.paywall.pitch}
            </ThemedText>

            <Card style={styles.bullets}>
              {bullets.map((bullet) => (
                <View key={bullet} style={styles.bullet}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                  <ThemedText type="small" style={styles.bulletText}>
                    {bullet}
                  </ThemedText>
                </View>
              ))}
            </Card>

            <ThemedText type="small" themeColor="textSecondary" style={styles.oneTime}>
              {t.paywall.oneTime}
            </ThemedText>

            <Button
              label={`${t.paywall.buy}${offer ? ` · ${offer.priceString}` : ''}`}
              onPress={buy}
              disabled={!offer || busy}
            />

            {!offer && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                {t.paywall.unavailable}
              </ThemedText>
            )}

            <Button label={t.paywall.restore} onPress={restore} variant="ghost" disabled={busy} />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  close: {
    alignSelf: 'flex-end',
  },
  title: {
    textAlign: 'center',
  },
  pitch: {
    textAlign: 'center',
  },
  proBadge: {
    alignItems: 'center',
    borderColor: 'transparent',
  },
  bullets: {
    gap: Spacing.two,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bulletText: {
    flex: 1,
  },
  oneTime: {
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
  },
});
