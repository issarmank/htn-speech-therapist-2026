import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND } from '@/constants/brand';
import { config } from '@/constants/config';
import { MAX_TITLE_SCALE } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';

export default function Profile() {
  const { email, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
          Account
        </Text>

        <View style={styles.card}>
          <Row label="Signed in as" value={email ?? 'Unknown'} />
          <Row label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <Row label="Backend" value={config.isDemoMode ? 'Demo fixtures' : (config.apiUrl ?? '')} />
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.signOut}
          onPress={async () => {
            await signOut();
            router.replace('/welcome');
          }}>
          <Text style={styles.signOutText}>Log out</Text>
        </Pressable>

        <Text style={styles.disclaimer}>{BRAND.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  body: { ...ContentColumn, flexGrow: 1, padding: Layout.page, gap: Layout.section },
  title: { ...Type.title1, color: Colors.ink },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    padding: Layout.card,
    gap: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  rowLabel: { ...Type.caption, color: Colors.muted },
  rowValue: { ...Type.caption, color: Colors.ink, flexShrink: 1 },
  signOut: {
    minHeight: Layout.cta,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.cta,
    borderWidth: 1,
    borderColor: Colors.rose,
  },
  signOutText: { ...Type.bodyStrong, color: Colors.rose },
  disclaimer: { ...Type.caption, color: Colors.muted, marginTop: 'auto' },
});
