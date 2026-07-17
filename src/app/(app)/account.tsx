import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { deleteAccount } from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { getPseudo, isValidPseudo } from '@/features/leaderboard/identity';
import { useStrings } from '@/i18n/strings';

export default function AccountScreen() {
  const t = useStrings();
  const { me, token, signOut, submitPseudo } = useSession();

  const currentPseudo = me?.pseudo ?? getPseudo() ?? '';
  const identity =
    me?.email ??
    (me?.providers.includes('apple')
      ? t.account.appleAccount
      : me?.providers.includes('google')
        ? t.account.googleAccount
        : t.account.emailAccount);

  const [pseudo, setPseudo] = useState(currentPseudo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const savePseudo = async () => {
    if (!isValidPseudo(pseudo)) {
      setError(t.account.pseudoInvalid);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await submitPseudo(pseudo.trim());
      setNotice(t.account.pseudoUpdated);
    } catch {
      setError(t.account.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t.account.deleteConfirmTitle, t.account.deleteConfirmBody, [
      { text: t.account.cancel, style: 'cancel' },
      {
        text: t.account.confirmDelete,
        style: 'destructive',
        onPress: async () => {
          try {
            if (token) await deleteAccount(token);
            await signOut();
          } catch {
            setError(t.account.errorGeneric);
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.account.title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <ThemedText type="label">{t.account.loggedTitle}</ThemedText>
          <ThemedText type="smallBold">{identity}</ThemedText>
          {me && (
            <ThemedText type="small" themeColor="textSecondary">
              {me.xpTotal} XP
            </ThemedText>
          )}
        </Card>

        <View style={styles.field}>
          <ThemedText type="label">{t.account.pseudoLabel}</ThemedText>
          <Input
            value={pseudo}
            onChangeText={setPseudo}
            placeholder={t.account.pseudoPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
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
          <Button
            label={t.account.pseudoSave}
            onPress={savePseudo}
            disabled={busy || pseudo.trim() === currentPseudo}
          />
        </View>

        <Button label={t.account.logout} onPress={signOut} variant="secondary" />
        <Button label={t.account.delete} onPress={confirmDelete} variant="danger" />
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
  field: {
    gap: Spacing.two,
  },
});
