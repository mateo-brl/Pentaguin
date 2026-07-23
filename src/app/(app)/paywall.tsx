import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { rankLabel } from '@/components/ui/rank-badge';
import { purchasesConfig } from '@/config/monetization';
import { Radius, Spacing } from '@/theme';
import { DEFAULT_PACK_ID, getDefaultPack } from '@/content';
import { getCompletedLessonIds } from '@/db/repositories';
import {
  activeProvider,
  lockedContentSummary,
  packEntitlement,
  useEntitlements,
  type ProOffer,
} from '@/features/monetization';
import { useRank } from '@/features/rank/ranks';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

// Stable au niveau module : l'identifiant du pack est le même dans toutes les langues.
const productId = purchasesConfig.iosProductByPack[DEFAULT_PACK_ID];

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
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const entitlements = useEntitlements();
  const isPro = entitlements.has(packEntitlement(pack.id));
  const rank = useRank();
  // Lecture unique à l'ouverture (modal) : de quoi personnaliser le pitch.
  const [completedCount] = useState(() => getCompletedLessonIds(DEFAULT_PACK_ID).size);
  const locked = lockedContentSummary(entitlements);

  const [offer, setOffer] = useState<ProOffer | null>(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    activeProvider
      .getProOffer(productId)
      .then((value) => {
        if (mounted) setOffer(value);
      })
      .finally(() => {
        if (mounted) setOfferLoading(false);
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

  // On ne promet les examens blancs que s'il en existe (sinon vente d'un
  // contenu absent → rejet App Review + perte de confiance).
  const bullets = [
    t.paywall.bulletDomains,
    t.paywall.bulletBank,
    ...(pack.exams.length > 0 ? [t.paywall.bulletExams] : []),
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Barre fixe hors du scroll : la fermeture reste toujours atteignable,
          grande cible (44×44) sous la safe area (Dynamic Island incluse). */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.paywall.close}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.closePressed,
          ]}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
            {/* Pitch personnalisé : ce que tu as accompli (valorisant), puis ce
                qui t'attend (concret), au lieu d'une liste générique. */}
            {completedCount > 0 && rank != null && (
              <ThemedText type="smallBold" style={styles.pitch}>
                {t.paywall.statLine
                  .replace('{lessons}', String(completedCount))
                  .replace('{rank}', rankLabel(rank, t))}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary" style={styles.pitch}>
              {locked.lockedThemes > 0
                ? t.paywall.remainLine
                    .replace('{themes}', String(locked.lockedThemes))
                    .replace('{lessons}', String(locked.lockedLessons))
                : t.paywall.pitch}
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

            {/* Achat unique mis en avant : l'argument de confiance clé. */}
            <Card background={theme.accentSoft} style={styles.oneTimeCard}>
              <Ionicons name="infinite" size={20} color={theme.accent} />
              <View style={styles.oneTimeTextWrap}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  {t.paywall.oneTimeTitle}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.paywall.oneTimeBody}
                </ThemedText>
              </View>
            </Card>

            {offerLoading ? (
              <ActivityIndicator style={styles.loading} color={theme.accent} />
            ) : (
              <>
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
              </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.base,
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
    gap: Spacing.sm,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  oneTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderColor: 'transparent',
  },
  oneTimeTextWrap: {
    flex: 1,
  },
  note: {
    textAlign: 'center',
  },
  loading: {
    paddingVertical: Spacing.sm,
  },
});
