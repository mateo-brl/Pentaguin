import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { backendConfig } from '@/config/backend';
import { Spacing } from '@/theme';
import { useStrings } from '@/i18n/strings';

export default function LegalScreen() {
  const t = useStrings();

  const sections = [
    { title: t.legal.collectTitle, body: t.legal.collectBody },
    { title: t.legal.noneTitle, body: t.legal.noneBody },
    { title: t.legal.rightsTitle, body: t.legal.rightsBody },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t.legal.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {t.legal.intro}
        </ThemedText>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="label">{section.title}</ThemedText>
            <ThemedText type="small">{section.body}</ThemedText>
          </View>
        ))}

        <View style={styles.section}>
          <ThemedText type="label">{t.legal.contactTitle}</ThemedText>
          <ThemedText
            type="small"
            themeColor="accent"
            onPress={() => Linking.openURL(`mailto:${t.legal.contactBody}`)}>
            {t.legal.contactBody}
          </ThemedText>
        </View>

        <ThemedText
          type="small"
          themeColor="accent"
          onPress={() => Linking.openURL(`${backendConfig.baseUrl}/privacy`)}>
          {t.legal.fullPolicy}
        </ThemedText>
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
    gap: Spacing.xs,
  },
});
