import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={styles.tabBarIcon} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.headerRightButton,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <FontAwesome
                  name="info-circle"
                  size={25}
                  color={theme.text}
                />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="ai-plan"
        options={{
          title: 'AI Plan',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="lightbulb-o" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="focus-mode"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="shield" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRightButton: {
    marginRight: 15,
  },
  tabBarIcon: {
    marginBottom: -3,
  },
});
