import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Type } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';

/** Bar height above the gesture area — one row of icon + label. */
const TAB_BAR_HEIGHT = 52;

export default function AppLayout() {
  const { status } = useAuth();
  // Android is edge-to-edge from RN 0.86 on, so the bar draws under the
  // gesture pill unless we lift it by the inset ourselves.
  const insets = useSafeAreaInsets();

  // Every route in this group calls an authenticated endpoint, so there is no
  // useful anonymous state to render.
  if (status === 'signedOut') return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.violet,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.line,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        // Label sits to the right of the icon rather than under it, which
        // keeps the bar to a single short row.
        tabBarLabelPosition: 'beside-icon',
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarLabelStyle: { ...Type.caption, marginBottom: 0, marginLeft: 4 },
        sceneStyle: { backgroundColor: Colors.canvas },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="hood" options={{ title: 'Under the hood' }} />
    </Tabs>
  );
}
