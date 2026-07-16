import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>

        <Text style={styles.mascot}>🐧✨</Text>
        <ThemedText type="subtitle" style={styles.title}>
          {t.paywall.title}
        </ThemedText>

        {isPro ? (
          <ThemedView style={[styles.proBadge, { backgroundColor: theme.successSoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              {t.paywall.alreadyPro}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {t.paywall.pitch}
            </ThemedText>
            <View style={styles.bullets}>
              {bullets.map((bullet) => (
                <ThemedText key={bullet} type="small">
                  ✓ {bullet}
                </ThemedText>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t.paywall.oneTime}
            </ThemedText>

            <Pressable
              disabled={!offer || busy}
              onPress={buy}
              style={[
                styles.buy,
                { backgroundColor: offer && !busy ? theme.accent : theme.backgroundSelected },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: offer && !busy ? theme.onAccent : theme.textSecondary }}>
                {t.paywall.buy}
                {offer ? ` · ${offer.priceString}` : ''}
              </ThemedText>
            </Pressable>

            {!offer && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                {t.paywall.unavailable}
              </ThemedText>
            )}

            <Pressable disabled={busy} onPress={restore} style={styles.restore}>
              <ThemedText type="small" themeColor="accent">
                {t.paywall.restore}
              </ThemedText>
            </Pressable>
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
    alignItems: 'center',
  },
  close: {
    alignSelf: 'flex-end',
  },
  mascot: {
    fontSize: 56,
  },
  title: {
    textAlign: 'center',
  },
  proBadge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  bullets: {
    gap: Spacing.two,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
  },
  buy: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  note: {
    textAlign: 'center',
  },
  restore: {
    paddingVertical: Spacing.two,
  },
});
