import { Stack, useLocalSearchParams } from 'expo-router';

import { PracticeScreen } from '@/features/drill/practice-screen';

export default function PracticeRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <><Stack.Screen options={{ title: 'Speech Mirror' }} /><PracticeScreen sessionId={sessionId ?? 'practice-demo'} /></>;
}
