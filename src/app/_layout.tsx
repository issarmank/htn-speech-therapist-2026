import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/auth-context';

// Held until the auth gate has decided where to send us, so the first frame
// the user sees is never the wrong screen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Phase 5 gates this on the Google fonts loading. For now the canvas is the
  // only thing that has to be right before the splash lifts.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.canvas },
            animation: 'fade',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="analyzing" options={{ animation: 'fade' }} />
          <Stack.Screen name="results" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
