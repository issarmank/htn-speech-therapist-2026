import Constants from 'expo-constants';
import { router } from 'expo-router';
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
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
            Account
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(app)');
              }
            }}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Type.title1, color: Colors.ink },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    ...Type.caption,
    color: Colors.violetDeep,
    fontWeight: '700',
  },
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
