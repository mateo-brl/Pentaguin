import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { penguinAvatarSvg } from '@/components/mascot/penguin-art';
import { SvgXml } from 'react-native-svg';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radius, Spacing } from '@/theme';
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
import { useToast } from '@/features/toast/toast';
import { useHues } from '@/hooks/use-hues';
import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

export default function AccountScreen() {
  const t = useStrings();
  const theme = useTheme();
  const { hueFor } = useHues();
  const { me, token, signOut, submitPseudo, updateAvatar } = useSession();
  const toast = useToast();

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

  const applyAvatar = (next: AvatarSpec) => {
    const previous = avatar;
    setAvatarSpec(next);
    // Rollback si la sauvegarde échoue (sinon l'UI diverge du serveur).
    updateAvatar(serializeAvatar(next)).catch(() => {
      setAvatarSpec(previous);
      toast.show(t.account.errorGeneric, 'error');
    });
  };

  const savePseudo = async () => {
    if (!isValidPseudo(pseudo)) {
      toast.show(t.account.pseudoInvalid, 'error');
      return;
    }
    setBusy(true);
    try {
      await submitPseudo(pseudo.trim());
      toast.show(t.account.pseudoUpdated, 'success');
    } catch {
      toast.show(t.account.errorGeneric, 'error');
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
            toast.show(t.account.errorGeneric, 'error');
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
      {icon === 'penguin' ? (
        <SvgXml xml={penguinAvatarSvg} width={34} height={34} />
      ) : ionicon ? (
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
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  field: {
    gap: Spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    borderColor: 'transparent',
  },
});
