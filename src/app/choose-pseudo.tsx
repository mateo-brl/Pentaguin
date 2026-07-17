import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { isValidPseudo } from '@/features/leaderboard/identity';
import { useStrings } from '@/i18n/strings';

export default function ChoosePseudoScreen() {
  const t = useStrings();
  const { submitPseudo, signOut } = useSession();

  const [pseudo, setPseudo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isValidPseudo(pseudo)) {
      setError(t.account.pseudoInvalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitPseudo(pseudo.trim());
      // Succès : la garde bascule sur 'ready', expo-router ouvre l'app.
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setError(t.account.pseudoInvalid);
      else if (err instanceof ApiError && err.status === 401) setError(t.account.errorGeneric);
      else setError(t.account.pseudoOffline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText type="title">{t.account.pseudoTitle}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.account.pseudoIntro}
            </ThemedText>
          </View>

          <Input
            value={pseudo}
            onChangeText={setPseudo}
            placeholder={t.account.pseudoPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={20}
          />
          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button label={t.account.pseudoCta} onPress={submit} disabled={busy} />
          <Button label={t.account.logout} onPress={signOut} variant="ghost" />
        </ScrollView>
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
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
});
