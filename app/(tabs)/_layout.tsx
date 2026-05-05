import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#38bdf8' : '#0ea5e9',
        tabBarInactiveTintColor: isDark ? '#71717a' : '#a1a1aa',
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff', // Zinc 950 / White
          borderTopColor: isDark ? '#27272a' : '#e4e4e7', // Zinc 800 / Zinc 200
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        headerStyle: { 
          backgroundColor: isDark ? '#09090b' : '#fafafa', // Zinc 950 / Zinc 50
          borderBottomColor: isDark ? '#27272a' : '#e4e4e7',
          borderBottomWidth: 1,
        },
        headerTintColor: isDark ? '#fafafa' : '#09090b',
        headerTitleStyle: { 
          fontWeight: '700',
          fontFamily: 'InterBold',
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Config',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
