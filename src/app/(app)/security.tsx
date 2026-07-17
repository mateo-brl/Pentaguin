import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import {
  ApiError,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { useStrings } from '@/i18n/strings';

export default function SecurityScreen() {
  const t = useStrings();
  const { me, token } = useSession();

  const hasPassword = Boolean(me?.providers.includes('email'));
  const hasEmail = Boolean(me?.email);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Changement de mot de passe (compte e-mail : on connaît l'ancien).
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  // Réinitialisation par e-mail (code à usage unique).
  const [resetOpen, setResetOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [resetPw, setResetPw] = useState('');

  const doChange = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await changePassword(token, current, next);
      setCurrent('');
      setNext('');
      setNotice(t.account.passwordChanged);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError(t.account.errorCurrentPassword);
      else if (err instanceof ApiError && err.status === 400) setError(t.account.errorInvalid);
      else setError(t.account.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (!me?.email) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestPasswordReset(me.email);
      setCodeSent(true);
      setNotice(t.account.codeSent);
    } catch {
      setError(t.account.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (!me?.email) return;
    setBusy(true);
    setError(null);
    try {
      await resetPassword(me.email, code.trim(), resetPw);
      setResetOpen(false);
      setCodeSent(false);
      setCode('');
      setResetPw('');
      setNotice(t.account.resetDone);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401 ? t.account.errorReset : t.account.errorGeneric,
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

        {notice && (
          <ThemedText type="small" themeColor="success">
            {notice}
          </ThemedText>
        )}
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
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
});
