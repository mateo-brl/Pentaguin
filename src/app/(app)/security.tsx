import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import {
  ApiError,
  changePassword,
  disable2fa,
  enable2fa,
  requestPasswordReset,
  resetPassword,
  setup2fa,
} from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { useToast } from '@/features/toast/toast';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function SecurityScreen() {
  const t = useStrings();
  const theme = useTheme();
  const toast = useToast();
  const { me, token, refresh } = useSession();

  const hasPassword = Boolean(me?.providers.includes('email'));
  const hasEmail = Boolean(me?.email);
  const twoFactorOn = Boolean(me?.twoFactor);

  const [busy, setBusy] = useState(false);

  // Changement de mot de passe (compte e-mail : on connaît l'ancien).
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  // Réinitialisation par e-mail (code à usage unique).
  const [resetOpen, setResetOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [resetPw, setResetPw] = useState('');

  // 2FA TOTP.
  const [setupData, setSetupData] = useState<{ secret: string; otpauth: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);

  const doChange = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await changePassword(token, current, next);
      setCurrent('');
      setNext('');
      toast.show(t.account.passwordChanged, 'success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401)
        toast.show(t.account.errorCurrentPassword, 'error');
      else if (err instanceof ApiError && err.status === 400)
        toast.show(t.account.errorInvalid, 'error');
      else toast.show(t.account.errorGeneric, 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (!me?.email) return;
    setBusy(true);
    try {
      await requestPasswordReset(me.email);
      setCodeSent(true);
      toast.show(t.account.codeSent, 'info');
    } catch {
      toast.show(t.account.errorGeneric, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (!me?.email) return;
    setBusy(true);
    try {
      await resetPassword(me.email, code.trim(), resetPw);
      setResetOpen(false);
      setCodeSent(false);
      setCode('');
      setResetPw('');
      toast.show(t.account.resetDone, 'success');
    } catch (err) {
      toast.show(
        err instanceof ApiError && err.status === 401 ? t.account.errorReset : t.account.errorGeneric,
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const startSetup = async () => {
    if (!token) return;
    setBusy(true);
    try {
      setSetupData(await setup2fa(token));
      setTwoFaCode('');
    } catch {
      toast.show(t.account.errorGeneric, 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await enable2fa(token, twoFaCode.trim());
      setSetupData(null);
      setTwoFaCode('');
      await refresh();
      toast.show(t.account.twoFactorEnabled, 'success');
    } catch (err) {
      toast.show(
        err instanceof ApiError && err.status === 401 ? t.account.errorMfaCode : t.account.errorGeneric,
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await disable2fa(token, twoFaCode.trim());
      setDisableOpen(false);
      setTwoFaCode('');
      await refresh();
      toast.show(t.account.twoFactorDisabled, 'success');
    } catch (err) {
      toast.show(
        err instanceof ApiError && err.status === 401 ? t.account.errorMfaCode : t.account.errorGeneric,
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.account.security }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!hasPassword && (
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              {t.account.noPasswordProvider}
            </ThemedText>
          </Card>
        )}

        {hasPassword && (
          <View style={styles.section}>
            <ThemedText type="label">{t.account.changePasswordTitle}</ThemedText>
            <Input
              value={current}
              onChangeText={setCurrent}
              placeholder={t.account.currentPasswordPlaceholder}
              secureTextEntry
            />
            <Input
              value={next}
              onChangeText={setNext}
              placeholder={t.account.newPasswordPlaceholder}
              secureTextEntry
            />
            <Button
              label={t.account.changePassword}
              onPress={doChange}
              disabled={busy || current.length === 0 || next.length < 8}
            />
          </View>
        )}

        {hasEmail && (
          <View style={styles.section}>
            <ThemedText type="label">{t.account.resetByEmailTitle}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.account.resetByEmailBody}
            </ThemedText>
            {!resetOpen ? (
              <Button
                label={t.account.resetByEmailTitle}
                variant="secondary"
                onPress={() => setResetOpen(true)}
              />
            ) : !codeSent ? (
              <Button label={t.account.sendCode} onPress={sendCode} disabled={busy} />
            ) : (
              <>
                <Input
                  value={code}
                  onChangeText={setCode}
                  placeholder={t.account.codePlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Input
                  value={resetPw}
                  onChangeText={setResetPw}
                  placeholder={t.account.newPasswordPlaceholder}
                  secureTextEntry
                />
                <Button label={t.account.resetDo} onPress={doReset} disabled={busy} />
              </>
            )}
          </View>
        )}

        {hasPassword && (
          <View style={styles.section}>
            <View style={styles.statusRow}>
              <ThemedText type="label">{t.account.twoFactorTitle}</ThemedText>
              <ThemedText
                type="smallBold"
                themeColor={twoFactorOn ? 'success' : 'textSecondary'}>
                {twoFactorOn ? t.account.twoFactorStatusOn : t.account.twoFactorStatusOff}
              </ThemedText>
            </View>

            {twoFactorOn ? (
              !disableOpen ? (
                <Button
                  label={t.account.twoFactorDisable}
                  variant="secondary"
                  onPress={() => {
                    setDisableOpen(true);
                    setTwoFaCode('');
                  }}
                />
              ) : (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.account.twoFactorDisableIntro}
                  </ThemedText>
                  <Input
                    value={twoFaCode}
                    onChangeText={setTwoFaCode}
                    placeholder={t.account.mfaPlaceholder}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Button
                    label={t.account.twoFactorDisable}
                    variant="danger"
                    onPress={confirmDisable}
                    disabled={busy || twoFaCode.trim().length < 6}
                  />
                </>
              )
            ) : setupData ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.account.twoFactorSetupIntro}
                </ThemedText>
                <Button
                  label={t.account.twoFactorOpenApp}
                  variant="secondary"
                  onPress={() => Linking.openURL(setupData.otpauth)}
                />
                <ThemedText type="label">{t.account.twoFactorManualKey}</ThemedText>
                <Card background={theme.backgroundSelected}>
                  <ThemedText type="mono" selectable>
                    {setupData.secret.replace(/(.{4})/g, '$1 ').trim()}
                  </ThemedText>
                </Card>
                <Input
                  value={twoFaCode}
                  onChangeText={setTwoFaCode}
                  placeholder={t.account.mfaPlaceholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  label={t.account.twoFactorConfirm}
                  onPress={confirmEnable}
                  disabled={busy || twoFaCode.trim().length < 6}
                />
              </>
            ) : (
              <Button label={t.account.twoFactorEnable} onPress={startSetup} disabled={busy} />
            )}
          </View>
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
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
