import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { FormField } from '@/components/form-field';
import { GradientButton } from '@/components/gradient-button';
import { MAX_TITLE_SCALE } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Type } from '@/constants/theme';
import { ApiError } from '@/features/api/contracts';
import { useAuth } from '@/features/auth/auth-context';

export default function Login() {
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<string>();
  const [busy, setBusy] = useState(false);

  const ready = email.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setBanner(undefined);

    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (error) {
      // 401 is deliberately one banner, not a per-field error: the server does
      // not say which half was wrong and neither should we.
      setBanner(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>

          <View style={styles.intro}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
              Welcome back
            </Text>
            <Text style={styles.sub}>Pick up where you left off.</Text>
          </View>

          <View style={styles.form}>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <FormField
              ref={passwordRef}
              label="Password"
              secure
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            {banner ? <Banner>{banner}</Banner> : null}
          </View>

          <View style={styles.actions}>
            <GradientButton label="Log in" onPress={submit} loading={busy} disabled={!ready} />
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace({ pathname: '/(auth)/signup', params: { email } })}>
              <Text style={styles.footer}>
                New here? <Text style={styles.link}>Create an account</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  flex: { flex: 1 },
  content: { ...ContentColumn, flexGrow: 1, padding: Layout.page, gap: Layout.section },
  back: { ...Type.bodyStrong, color: Colors.violetDeep },
  intro: { gap: 8 },
  title: { ...Type.title1, color: Colors.ink },
  sub: { ...Type.body, color: Colors.body },
  form: { gap: Layout.gap },
  actions: { gap: Layout.gap },
  footer: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  link: { color: Colors.violetDeep },
});
