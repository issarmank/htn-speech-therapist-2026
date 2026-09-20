import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.canvas, justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.violet} />
      </View>
    );
  }

  return <Redirect href={status === 'signedIn' ? '/(app)' : '/welcome'} />;
}
