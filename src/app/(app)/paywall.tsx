import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { rankLabel } from '@/components/ui/rank-badge';
import { backendConfig } from '@/config/backend';
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
 * Équivalent mensuel d'un prix annuel, dans le format local du store (on
 * remplace la partie numérique du prix formaté pour garder devise et position).
 * Renvoie null si le calcul n'est pas fiable : on n'affiche alors rien.
 */
function monthlyEquivalent(offer: ProOffer): string | null {
  const { price, priceString } = offer;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  const match = priceString.match(/[\d][\d\s .,]*/);
  if (!match) return null;
  const comma = match[0].includes(',');
  const monthly = (price / 12).toFixed(2).replace('.', comma ? ',' : '.');
  return priceString.replace(match[0], monthly);
}

/**
 * SEUL écran de vente (modal). Abonnement annuel auto-renouvelable : Apple exige
 * d'afficher la durée, le prix, la mention de renouvellement automatique et des
 * liens fonctionnels vers les CGU et la confidentialité (guideline 3.1.2).
 * Règles maison : prix d'emblée, fermeture en un geste, pas d'urgence factice.
 */
export default function PaywallScreen() {
  const pack = getDefaultPack();
  const t = useStrings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const entitlements = useEntitlements();
  const isPro = entitlements.has(packEntitlement(pack.id));
  const rank = useRank();
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

  // Arguments chiffrés à partir du contenu réel : ils restent vrais si le pack grandit.
  const bullets = [
    t.paywall.bulletDomains.replace('{lessons}', String(pack.lessons.length)),
    t.paywall.bulletBank.replace('{questions}', String(pack.questions.length)),
    // On ne promet un examen que s'il en existe (sinon rejet en revue + confiance perdue).
    ...(pack.exams.length > 0
      ? [t.paywall.bulletExams.replace('{exams}', String(pack.exams.length))]
      : []),
    t.paywall.bulletPractice,
  ];

  const monthly = offer ? monthlyEquivalent(offer) : null;

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
            {/* Pitch personnalisé : ce que tu as accompli, puis ce qui t'attend. */}
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

            {/* Prix + durée : obligation d'affichage pour un abonnement. */}
            {offerLoading ? (
              <ActivityIndicator style={styles.loading} color={theme.accent} />
            ) : offer ? (
              <>
                <Card background={theme.accentSoft} style={styles.priceCard}>
                  <ThemedText type="label" style={{ color: theme.accent }}>
                    {t.paywall.renewTitle}
                  </ThemedText>
                  <View style={styles.priceRow}>
                    <ThemedText type="subtitle">{offer.priceString}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.paywall.perYear}
                    </ThemedText>
                  </View>
                  {monthly && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.paywall.monthlyHint.replace('{price}', monthly)}
                    </ThemedText>
                  )}
                </Card>

                <Button label={t.paywall.buy} onPress={buy} disabled={busy} />
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                {t.paywall.unavailable}
              </ThemedText>
            )}

            <Button label={t.paywall.restore} onPress={restore} variant="ghost" disabled={busy} />

            {/* Mention de renouvellement automatique + liens légaux : sans eux,
                l'app est rejetée en revue (guideline 3.1.2). */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
              {t.paywall.renewBody}
            </ThemedText>
            <View style={styles.legalLinks}>
              <ThemedText
                type="small"
                themeColor="accent"
                onPress={() => Linking.openURL(purchasesConfig.termsUrl)}>
                {t.paywall.terms}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ·
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="accent"
                onPress={() => Linking.openURL(`${backendConfig.baseUrl}/privacy`)}>
                {t.paywall.privacyLink}
              </ThemedText>
            </View>
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
  priceCard: {
    gap: Spacing.xs,
    borderColor: 'transparent',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
  loading: {
    paddingVertical: Spacing.sm,
  },
  legal: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
