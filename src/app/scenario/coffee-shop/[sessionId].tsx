import { Stack, useLocalSearchParams } from 'expo-router';

import { ScenarioScreen } from '@/features/scenario/scenario-screen';

export default function CoffeeShopRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <><Stack.Screen options={{ title: 'Coffee Shop' }} /><ScenarioScreen sessionId={sessionId ?? 'coffee-demo'} /></>;
}
