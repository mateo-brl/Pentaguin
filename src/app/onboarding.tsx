import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Penguin } from '@/components/mascot/penguin';
import { type PenguinState } from '@/components/mascot/penguin-art';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FontFamily, Radius, Spacing } from '@/theme';
import { completeOnboarding } from '@/features/settings/first-run';
import { errorFeedback, successFeedback } from '@/features/haptics/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

const STEPS = 3;
const CORRECT: 'a' | 'b' = 'b'; // la phrase de passe l'emporte sur le mot court à symboles

/**
 * Onboarding en 3 temps. Le cœur : un mini-pari JOUABLE (« à ton avis ? »), le
 * mécanisme des leçons vécu en dix secondes, AVANT la connexion. On fait
 * ressentir le produit au lieu de le décrire. Sortie possible à tout moment.
 */
export default function OnboardingScreen() {
  const t = useStrings();
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);

  const gotIt = picked === CORRECT;

  const pick = (choice: 'a' | 'b') => {
    if (picked) return;
    setPicked(choice);
    if (choice === CORRECT) successFeedback();
    else errorFeedback();
  };

  const penguinState: PenguinState =
    step === 0 ? 'correct' : step === 2 ? 'rankup' : picked == null ? 'focus' : gotIt ? 'correct' : 'wrong';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Sortie discrète, toujours atteignable (jamais de mur). */}
        <View style={styles.topBar}>
          {step < STEPS - 1 ? (
            <Pressable onPress={completeOnboarding} hitSlop={12}>
              <ThemedText type="small" themeColor="textSecondary">
                {t.onboarding.skip}
              </ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        <View style={styles.content}>
          <Penguin
            key={step}
            state={penguinState}
            accessory="terminal"
            size={116}
            animation={step === 1 && picked == null ? 'float' : 'pop'}
          />

          {step === 0 && (
            <View style={styles.block}>
              <ThemedText type="title" style={styles.center}>
                {t.onboarding.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t.onboarding.subtitle}
              </ThemedText>
            </View>
          )}

          {step === 1 && (
            <View style={styles.block}>
              <ThemedText type="label" themeColor="accent" style={styles.center}>
                {t.onboarding.tryLabel}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.center}>
                {t.onboarding.tryQuestion}
              </ThemedText>
              <View style={styles.choices}>
                {(['a', 'b'] as const).map((c) => {
                  const label = c === 'a' ? t.onboarding.tryChoiceA : t.onboarding.tryChoiceB;
                  const isAnswer = picked != null && c === CORRECT;
                  const isWrongPick = picked === c && c !== CORRECT;
                  return (
                    <Pressable
                      key={c}
                      disabled={picked != null}
                      onPress={() => pick(c)}
                      style={[
                        styles.choice,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                        isAnswer && { backgroundColor: theme.successSoft, borderColor: theme.success },
                        isWrongPick && { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
                      ]}>
                      <ThemedText style={[styles.choiceText, { color: theme.text }]}>{label}</ThemedText>
                      {isAnswer && <Ionicons name="checkmark-circle" size={20} color={theme.success} />}
                      {isWrongPick && <Ionicons name="close-circle" size={20} color={theme.danger} />}
                    </Pressable>
                  );
                })}
              </View>
              {picked != null && (
                <View style={[styles.reveal, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold" style={{ color: gotIt ? theme.success : theme.accent }}>
                    {gotIt ? t.onboarding.tryRight : t.onboarding.tryWrong}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.onboarding.tryReveal}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.block}>
              <ThemedText type="title" style={styles.center}>
                {t.onboarding.promiseTitle}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t.onboarding.promiseBody}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Points de progression */}
        <View style={styles.dots}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? theme.accent : theme.backgroundElement },
              ]}
            />
          ))}
        </View>

        {step === 0 && <Button label={t.onboarding.next} onPress={() => setStep(1)} />}
        {step === 1 &&
          (picked != null ? (
            <Button label={t.onboarding.next} onPress={() => setStep(2)} />
          ) : (
            <View style={styles.buttonSpacer} />
          ))}
        {step === 2 && <Button label={t.onboarding.cta} onPress={completeOnboarding} />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  block: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  choices: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  choiceText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 14,
  },
  reveal: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  buttonSpacer: {
    height: 56,
  },
});
