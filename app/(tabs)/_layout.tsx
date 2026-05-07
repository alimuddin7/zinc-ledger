import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: isDark ? '#52525b' : '#a1a1aa',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderTopColor: isDark ? '#18181b' : '#f4f4f5',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 32 : (insets.bottom > 0 ? insets.bottom : 12),
          elevation: 0,
          shadowOpacity: 0,
          ...(Platform.OS === 'web' ? {
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            borderTopWidth: 0,
          } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: 'InterSemiBold',
          fontSize: 10,
          marginBottom: Platform.OS === 'ios' ? 0 : 8,
          letterSpacing: 0.2,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="simulation"
        options={{
          title: 'Sandbox',
          tabBarIcon: ({ color }) => <TabBarIcon name="flask" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Config',
          tabBarIcon: ({ color }) => <TabBarIcon name="sliders" color={color} />,
        }}
      />
    </Tabs>
  );
}
