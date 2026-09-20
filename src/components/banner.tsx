import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Type } from '@/constants/theme';

type Tone = 'error' | 'info';

export function Banner({ tone = 'error', children }: { tone?: Tone; children: string }) {
  return (
    <View style={[styles.base, tone === 'error' ? styles.error : styles.info]}>
      <Text style={[styles.text, tone === 'error' ? styles.errorText : styles.infoText]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: 14, borderRadius: Radius.chip },
  error: { backgroundColor: Colors.roseTint },
  info: { backgroundColor: Colors.blueTint },
  text: { ...Type.caption },
  errorText: { color: Colors.rose },
  infoText: { color: Colors.blueText },
});
