import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import {
  ApiError,
  deleteAccount,
  fetchMe,
  login,
  loginWithApple,
  loginWithGoogle,
  register,
  type Me,
  type Session,
} from '@/features/account/api';
import { clearToken, getToken, setToken } from '@/features/account/token';
import { getDeviceId, resetLeaderboardIdentity } from '@/features/leaderboard/identity';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStrings, type Strings } from '@/i18n/strings';

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

function errorMessage(error: unknown, t: Strings): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return t.account.errorCredentials;
    if (error.status === 409) return t.account.errorEmailTaken;
    if (error.status === 400) return t.account.errorInvalid;
  }
  return t.account.errorGeneric;
}

/** Rendu uniquement quand un client OAuth Google est configuré (règle des hooks). */
function GoogleSignInButton({
  onSession,
  onError,
}: {
  onSession: (session: Session) => void;
  onError: () => void;
}) {
  const t = useStrings();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) return;
    loginWithGoogle(idToken, getDeviceId()).then(onSession).catch(onError);
  }, [response, onSession, onError]);

  return (
    <Button
      label={t.account.google}
      onPress={() => promptAsync()}
      variant="secondary"
      disabled={!request}
    />
  );
}

export default function AccountScreen() {
  const t = useStrings();
  const scheme = useColorScheme();

  const [token, setTokenState] = useState<string | null | undefined>(undefined);
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => {});
    (async () => {
      const stored = await getToken();
      if (!stored) {
        setTokenState(null);
        return;
      }
      try {
        setMe(await fetchMe(stored));
        setTokenState(stored);
      } catch {
        await clearToken();
        setTokenState(null);
      }
    })();
  }, []);

  const finishLogin = async (session: Session) => {
    await setToken(session.token);
    setTokenState(session.token);
    setError(null);
    try {
      setMe(await fetchMe(session.token));
    } catch {
      // le /me se rechargera à la prochaine ouverture
    }
  };

  const submit = async (action: 'login' | 'register') => {
    setBusy(true);
    setError(null);
    try {
      const call = action === 'login' ? login : register;
      await finishLogin(await call(email.trim(), password, getDeviceId()));
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const handleApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (credential.identityToken) {
        await finishLogin(await loginWithApple(credential.identityToken, getDeviceId()));
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') setError(errorMessage(err, t));
    }
  };

  const logout = async () => {
    await clearToken();
    resetLeaderboardIdentity();
    setTokenState(null);
    setMe(null);
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
            await logout();
          } catch {
            setError(t.account.errorGeneric);
          }
        },
      },
    ]);
  };

  if (token === undefined) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: t.account.title }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.account.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {token && me ? (
          <>
            <Card>
              <ThemedText type="label">{t.account.loggedTitle}</ThemedText>
              <ThemedText type="smallBold">
                {me.email ??
                  (me.providers.includes('apple')
                    ? t.account.appleAccount
                    : t.account.googleAccount)}
              </ThemedText>
              {me.pseudo && (
                <ThemedText type="small" themeColor="textSecondary">
                  {me.pseudo} · {me.xpTotal} XP
                </ThemedText>
              )}
            </Card>
            <Button label={t.account.logout} onPress={logout} variant="secondary" />
            <Button label={t.account.delete} onPress={confirmDelete} variant="danger" />
          </>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {t.account.intro}
            </ThemedText>

            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t.account.emailPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t.account.passwordPlaceholder}
              secureTextEntry
            />
            {error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}

            <Button label={t.account.login} onPress={() => submit('login')} disabled={busy} />
            <Button
              label={t.account.register}
              onPress={() => submit('register')}
              variant="secondary"
              disabled={busy}
            />

            {(appleAvailable || GOOGLE_IOS_CLIENT_ID) && (
              <View style={styles.divider}>
                <ThemedText type="label">{t.account.or}</ThemedText>
              </View>
            )}

            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  scheme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={14}
                style={styles.appleButton}
                onPress={handleApple}
              />
            )}

            {GOOGLE_IOS_CLIENT_ID ? (
              <GoogleSignInButton
                onSession={finishLogin}
                onError={() => setError(t.account.errorGeneric)}
              />
            ) : null}
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
  },
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  appleButton: {
    height: 52,
  },
});
