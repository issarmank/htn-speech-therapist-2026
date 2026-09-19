import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <AnimatedSplashOverlay />
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="mission/clear-speak-r" options={{ title: 'ClearSpeak' }} />
      <Stack.Screen name="practice/[sessionId]" options={{ title: 'Speech Mirror' }} />
      <Stack.Screen name="scenario/coffee-shop/[sessionId]" options={{ title: 'Coffee Shop' }} />
      <Stack.Screen name="reveal/[sessionId]" options={{ title: 'Your progress' }} />
    </Stack>
  </ThemeProvider>;
}
