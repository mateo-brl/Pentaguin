import Constants from 'expo-constants';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { GOAL_XP, GOAL_LEVELS, type GoalLevel } from '@/features/gamification/retention';
import { Spacing } from '@/theme';
import { setDailyGoalLevel, useDailyGoalLevel } from '@/features/settings/daily-goal';
import { areRemindersEnabled, setRemindersEnabled } from '@/features/settings/notifications';
import { setThemeMode, useThemeMode, type ThemeMode } from '@/features/settings/theme-mode';
import { useTheme } from '@/hooks/use-theme';
import { getLocale, setLocale, useStrings, type Locale } from '@/i18n/strings';

export default function SettingsScreen() {
  const t = useStrings();
  const theme = useTheme();
  const themeMode = useThemeMode();
  const goalLevel = useDailyGoalLevel();
  const locale = getLocale();
  const version = Constants.expoConfig?.version ?? '0.0.0';

  const goalLabel: Record<GoalLevel, string> = {
    light: t.retention.goalLight,
    normal: t.retention.goalNormal,
    intense: t.retention.goalIntense,
  };

  const [reminders, setReminders] = useState(() => areRemindersEnabled());
  const [reminderDenied, setReminderDenied] = useState(false);

  const toggleReminders = async (value: boolean) => {
    const applied = await setRemindersEnabled(value);
    setReminders(applied);
    setReminderDenied(value && !applied);
  };

  const languages: { value: Locale; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];
  const themeModes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t.settings.themeSystem },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.settings.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText type="label">{t.settings.language}</ThemedText>
          <View style={styles.chips}>
            {languages.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={locale === item.value}
                onPress={() => setLocale(item.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="label">{t.settings.theme}</ThemedText>
          <View style={styles.chips}>
            {themeModes.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={themeMode === item.value}
                onPress={() => setThemeMode(item.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="label">{t.retention.goalSettingTitle}</ThemedText>
          <View style={styles.chips}>
            {GOAL_LEVELS.map((level) => (
              <Chip
                key={level}
                label={`${goalLabel[level]} · ${GOAL_XP[level]} XP`}
                selected={goalLevel === level}
                onPress={() => setDailyGoalLevel(level)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="label">{t.settings.notifications}</ThemedText>
          <View style={styles.switchRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.switchLabel}>
              {t.settings.notificationsDesc}
            </ThemedText>
            <Switch
              value={reminders}
              onValueChange={toggleReminders}
              trackColor={{ true: theme.accent }}
            />
          </View>
          {reminderDenied && (
            <ThemedText type="small" themeColor="danger">
              {t.settings.notificationsDenied}
            </ThemedText>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="label">{t.settings.about}</ThemedText>
          <ThemedText
            type="small"
            themeColor="accent"
            onPress={() => router.push('/legal')}>
            {t.settings.privacy}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.settings.version} {version}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {t.profile.disclaimer}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
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
  section: {
    gap: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  switchLabel: {
    flex: 1,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
