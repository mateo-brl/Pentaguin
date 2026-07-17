import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { deleteAccount } from '@/features/account/api';
import {
  AVATAR_COLORS,
  AVATAR_ICONS,
  ioniconFor,
  parseAvatar,
  serializeAvatar,
  type AvatarIcon,
  type AvatarSpec,
} from '@/features/account/avatar';
import { useSession } from '@/features/account/session';
import { getPseudo, isValidPseudo } from '@/features/leaderboard/identity';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function AccountScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const { me, token, signOut, submitPseudo, updateAvatar } = useSession();

  const currentPseudo = me?.pseudo ?? getPseudo() ?? '';
  const identity =
    me?.email ??
    (me?.providers.includes('apple')
      ? t.account.appleAccount
      : me?.providers.includes('google')
        ? t.account.googleAccount
        : t.account.emailAccount);

  const [avatar, setAvatarSpec] = useState<AvatarSpec>(() => parseAvatar(me?.avatar, currentPseudo));
  const [pseudo, setPseudo] = useState(currentPseudo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const applyAvatar = (next: AvatarSpec) => {
    setAvatarSpec(next);
    updateAvatar(serializeAvatar(next)).catch(() => setError(t.account.errorGeneric));
  };

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
        {/* En-tête identité */}
        <View style={styles.hero}>
          <Avatar spec={avatar} pseudo={currentPseudo} size={88} />
          <ThemedText type="subtitle">{currentPseudo}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {identity}
            {me ? ` · ${me.xpTotal} XP` : ''}
          </ThemedText>
        </View>

        {/* Choix de l'avatar */}
        <View style={styles.field}>
          <ThemedText type="label">{t.account.avatarLabel}</ThemedText>
          <View style={styles.iconGrid}>
            {AVATAR_ICONS.map((icon) => (
              <AvatarIconChoice
                key={icon}
                icon={icon}
                selected={avatar.icon === icon}
                pseudo={currentPseudo}
                onPress={() => applyAvatar({ ...avatar, icon })}
              />
            ))}
          </View>
          <View style={styles.colorRow}>
            {Array.from({ length: AVATAR_COLORS }, (_, color) => {
              const hue = hueFor(color);
              const selected = avatar.color === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => applyAvatar({ ...avatar, color })}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: hue.base },
                    selected && { borderColor: theme.text, borderWidth: 3 },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Pseudo */}
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

function AvatarIconChoice({
  icon,
  selected,
  pseudo,
  onPress,
}: {
  icon: AvatarIcon;
  selected: boolean;
  pseudo: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const ionicon = ioniconFor(icon);
  const initial = pseudo.trim().slice(0, 1).toUpperCase() || 'P';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.iconChoice,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        selected && { borderColor: theme.accent, borderWidth: 2 },
      ]}>
      {ionicon ? (
        <Ionicons
          name={ionicon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={selected ? theme.accent : theme.textSecondary}
        />
      ) : (
        <ThemedText type="smallBold" style={{ color: selected ? theme.accent : theme.textSecondary }}>
          {initial}
        </ThemedText>
      )}
    </Pressable>
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
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  field: {
    gap: Spacing.two,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: 'transparent',
  },
});
