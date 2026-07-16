import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useStrings } from '@/i18n/strings';

// Icônes emoji (pas de dépendance de police/icônes en v1 ; artwork dédié prévu M8/TODO).
function TabEmoji({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{emoji}</Text>;
}

export default function AppTabs() {
  const theme = useTheme();
  const t = useStrings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.backgroundElement },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color }) => <TabEmoji emoji="🐧" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t.tabs.learn,
          tabBarIcon: ({ color }) => <TabEmoji emoji="📚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: t.tabs.train,
          tabBarIcon: ({ color }) => <TabEmoji emoji="🎯" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color }) => <TabEmoji emoji="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
