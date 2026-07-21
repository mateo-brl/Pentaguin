import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/theme';
import {
  ApiError,
  isMfaChallenge,
  isVerifyChallenge,
  login,
  loginWithApple,
  loginWithGoogle,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verify2fa,
  verifyEmail,
  type LoginResult,
  type Session,
} from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { getDeviceId } from '@/features/leaderboard/identity';
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

export default function SignInScreen() {
  const t = useStrings();
  const scheme = useColorScheme();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // Étape 2FA : jeton de défi reçu après un mot de passe valide.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  // Étape vérification d'e-mail : jeton reçu à l'inscription / connexion non vérifiée.
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => {});
  }, []);

  const handleResult = async (result: LoginResult) => {
    if (isVerifyChallenge(result)) {
      setVerifyToken(result.verifyToken);
      setVerifyCode('');
    } else if (isMfaChallenge(result)) {
      setMfaToken(result.mfaToken);
      setMfaCode('');
    } else {
      await signIn(result);
    }
  };

  const submit = async (action: 'login' | 'register') => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result =
        action === 'register'
          ? await register(email.trim(), password, getDeviceId())
          : await login(email.trim(), password, getDeviceId());
      await handleResult(result);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submitMfa = async () => {
    if (!mfaToken) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(await verify2fa(mfaToken, mfaCode.trim()));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? t.account.errorMfaCode : errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const cancelMfa = () => {
    setMfaToken(null);
    setMfaCode('');
    setError(null);
  };

  const submitVerify = async () => {
    if (!verifyToken) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(await verifyEmail(verifyToken, verifyCode.trim()));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? t.account.errorMfaCode : errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const resendVerify = async () => {
    if (!verifyToken) return;
    setError(null);
    try {
      await resendVerification(verifyToken);
      setNotice(t.account.verifyResent);
    } catch {
      setError(t.account.errorGeneric);
    }
  };

  const cancelVerify = () => {
    setVerifyToken(null);
    setVerifyCode('');
    setError(null);
    setNotice(null);
  };

  const handleApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (credential.identityToken) {
        await signIn(await loginWithApple(credential.identityToken, getDeviceId()));
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') setError(errorMessage(err, t));
    }
  };

  const sendResetCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setCodeSent(true);
      setNotice(t.account.codeSent);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      setResetMode(false);
      setCodeSent(false);
      setCode('');
      setNewPassword('');
      setPassword('');
      setNotice(t.account.resetDone);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401 ? t.account.errorReset : errorMessage(err, t),
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleResetMode = (value: boolean) => {
    setResetMode(value);
    setCodeSent(false);
    setError(null);
    setNotice(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText type="title">
              {verifyToken
                ? t.account.verifyTitle
                : mfaToken
                  ? t.account.mfaTitle
                  : t.account.gateTitle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {verifyToken
                ? t.account.verifyIntro
                : mfaToken
                  ? t.account.mfaIntro
                  : resetMode
                    ? t.account.resetIntro
                    : t.account.gateSubtitle}
            </ThemedText>
          </View>

          {verifyToken ? (
            <>
              <Input
                value={verifyCode}
                onChangeText={setVerifyCode}
                placeholder={t.account.mfaPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
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
                label={t.account.mfaValidate}
                onPress={submitVerify}
                disabled={busy || verifyCode.trim().length < 6}
              />
              <Button label={t.account.verifyResend} onPress={resendVerify} variant="secondary" />
              <Button label={t.account.back} onPress={cancelVerify} variant="ghost" />
            </>
          ) : mfaToken ? (
            <>
              <Input
                value={mfaCode}
                onChangeText={setMfaCode}
                placeholder={t.account.mfaPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}
              <Button
                label={t.account.mfaValidate}
                onPress={submitMfa}
                disabled={busy || mfaCode.trim().length < 6}
              />
              <Button label={t.account.back} onPress={cancelMfa} variant="ghost" />
            </>
          ) : resetMode ? (
            <>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder={t.account.emailPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
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
              {!codeSent ? (
                <Button label={t.account.sendCode} onPress={sendResetCode} disabled={busy} />
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
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t.account.newPasswordPlaceholder}
                    secureTextEntry
                  />
                  <Button label={t.account.resetDo} onPress={doReset} disabled={busy} />
                </>
              )}
              <Button
                label={t.account.back}
                onPress={() => toggleResetMode(false)}
                variant="ghost"
              />
            </>
          ) : (
            <>
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

              <Button label={t.account.login} onPress={() => submit('login')} disabled={busy} />
              <Button
                label={t.account.register}
                onPress={() => submit('register')}
                variant="secondary"
                disabled={busy}
              />
              <Button
                label={t.account.forgot}
                onPress={() => toggleResetMode(true)}
                variant="ghost"
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
                  onSession={signIn}
                  onError={() => setError(t.account.errorGeneric)}
                />
              ) : null}
            </>
          )}
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
    padding: Spacing.lg,
    gap: Spacing.base,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  appleButton: {
    height: 52,
  },
});
