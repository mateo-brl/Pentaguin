import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Radius, Spacing, Stroke } from '@/theme';
import { tapFeedback } from '@/features/haptics/haptics';
import { chooseLocale, deviceLocaleGuess } from '@/features/settings/locale-choice';
import { useTheme } from '@/hooks/use-theme';
import type { Locale } from '@/i18n/strings';

/**
 * Tout premier écran : choix de la langue. Volontairement BILINGUE (il doit se
 * comprendre avant d'avoir choisi) et sans texte traduit. Pré-sélectionne la
 * langue de l'appareil ; la langue reste modifiable dans Réglages.
 */
// Pas de drapeau : une langue n'est pas un pays (l'anglais n'est pas « le
// Royaume-Uni »). Le code ISO en mono suffit et reste dans notre système.
const OPTIONS: { locale: Locale; code: string; label: string; hint: string }[] = [
  { locale: 'fr', code: 'FR', label: 'Français', hint: 'Continuer en français' },
  { locale: 'en', code: 'EN', label: 'English', hint: 'Continue in English' },
];

export default function ChooseLanguageScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<Locale>(() => deviceLocaleGuess());

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Penguin state="neutral" size={92} animation="float" />
          <ThemedText type="title" style={styles.title}>
            Pentaguin
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Choisis ta langue · Choose your language
          </ThemedText>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.locale;
            return (
              <Pressable
                key={option.locale}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  tapFeedback();
                  setSelected(option.locale);
                }}
                style={[
                  styles.option,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: isSelected ? theme.accent : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.codeChip,
                    {
                      backgroundColor: isSelected ? theme.accentSoft : theme.backgroundSelected,
                      borderColor: isSelected ? theme.accent : theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="mono"
                    style={{ color: isSelected ? theme.accent : theme.textSecondary, fontSize: 15 }}>
                    {option.code}
                  </ThemedText>
                </View>
                <View style={styles.optionText}>
                  <ThemedText type="smallBold">{option.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {option.hint}
                  </ThemedText>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            label={selected === 'fr' ? 'Continuer' : 'Continue'}
            onPress={() => chooseLocale(selected)}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Modifiable à tout moment dans Réglages · Changeable anytime in Settings
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  header: { paddingTop: Spacing.xxxl, alignItems: 'center', gap: Spacing.xs },
  title: { fontSize: 30, lineHeight: 36 },
  subtitle: { textAlign: 'center' },
  options: { gap: Spacing.base },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  codeChip: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: Stroke.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: Spacing.xs },
  footer: { paddingBottom: Spacing.xl, gap: Spacing.sm },
  note: { textAlign: 'center' },
});
