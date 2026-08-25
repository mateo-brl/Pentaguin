import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/theme';
import { getDefaultPack } from '@/content';
import { getPracticeExercises, getPracticeMissions } from '@/content/practice';
import { successFeedback } from '@/features/haptics/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const ROW_DELAY = 130;

/**
 * Après l'achat : on montre ce qui vient de s'ouvrir, une ligne à la fois.
 * Un abonnement qui se conclut par « abonnement actif » ne donne rien à voir ;
 * ici chaque ligne est un chiffre réel du pack, et le bouton envoie
 * directement dans le contenu.
 */
export default function ProWelcomeScreen() {
  const t = useStrings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pack = getDefaultPack();

  const rows = useMemo(() => {
    const exercises = getPracticeExercises().length;
    const missions = getPracticeMissions().length;
    return [
      { icon: 'grid' as const, value: String(pack.domains.length), label: t.proWelcome.themes },
      { icon: 'book' as const, value: String(pack.lessons.length), label: t.proWelcome.lessons },
      {
        icon: 'help-circle' as const,
        value: String(pack.questions.length),
        label: t.proWelcome.questions,
      },
      ...(pack.exams.length > 0
        ? [
            {
              icon: 'timer' as const,
              value: String(pack.exams.length),
              label: t.proWelcome.exams,
            },
          ]
        : []),
      {
        icon: 'terminal' as const,
        value: String(exercises + missions),
        label: t.proWelcome.practice,
      },
    ];
  }, [pack, t]);

  // Une valeur par ligne : entrée décalée, ça donne le sentiment que ça se
  // déverrouille pièce par pièce plutôt qu'un bloc qui apparaît.
  const [anims] = useState(() => rows.map(() => new Animated.Value(0)));
  const [halo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    successFeedback();
    Animated.timing(halo, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.stagger(
      ROW_DELAY,
      anims.map((value) =>
        Animated.spring(value, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 140 }),
      ),
    ).start();
  }, [anims, halo]);

  const close = () => {
    router.replace('/learn');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.hero}>
          <Animated.View
            style={[
              styles.halo,
              {
                backgroundColor: theme.accentSoft,
                opacity: halo,
                transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
              },
            ]}
          />
          <Penguin state="rankup" accessory="hoodie" size={148} animation="pop" />
        </View>

        <ThemedText type="title" style={styles.center}>
          {t.proWelcome.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {t.proWelcome.subtitle}
        </ThemedText>

        <View style={styles.rows}>
          {rows.map((row, index) => (
            <Animated.View
              key={row.label}
              style={[
                styles.row,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                {
                  opacity: anims[index],
                  transform: [
                    {
                      translateY: anims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={row.icon} size={18} color={theme.accent} />
              </View>
              <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 18 }}>
                {row.value}
              </ThemedText>
              <ThemedText type="small" style={styles.rowLabel}>
                {row.label}
              </ThemedText>
              <Ionicons name="lock-open" size={16} color={theme.success} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {t.proWelcome.note}
          </ThemedText>
          <Button label={t.proWelcome.cta} onPress={close} style={styles.cta} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.base,
  },
  hero: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
  },
  center: { textAlign: 'center' },
  rows: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  footer: { marginTop: 'auto', gap: Spacing.sm },
  cta: { alignSelf: 'stretch' },
});
