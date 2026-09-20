import { Redirect, Tabs } from 'expo-router';

import { Colors, Type } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';

export default function AppLayout() {
  const { status } = useAuth();

  // Every route in this group calls an authenticated endpoint, so there is no
  // useful anonymous state to render.
  if (status === 'signedOut') return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.violet,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.line },
        tabBarLabelStyle: { ...Type.caption },
        sceneStyle: { backgroundColor: Colors.canvas },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="hood" options={{ title: 'Under the hood' }} />
    </Tabs>
  );
}
