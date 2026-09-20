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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [banner, setBanner] = useState<string>();
  const [busy, setBusy] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  // Server rule: min_length=8, max_length=128.
  const passwordValid = password.length >= 8 && password.length <= 128;

  async function submit() {
    if (!emailValid || !passwordValid || busy) return;
    setBusy(true);
    setEmailError(undefined);
    setBanner(undefined);

    try {
      await signUp(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
        setEmailError('That email already has an account. Log in instead.');
      } else if (error instanceof ApiError && error.code === 'VALIDATION') {
        setEmailError(error.fields?.email);
        setBanner(error.fields?.email ? undefined : error.message);
      } else {
        setBanner(
          error instanceof ApiError
            ? error.message
            : "Couldn't reach the server. Check your connection and try again.",
        );
      }
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
              Create your account
            </Text>
            <Text style={styles.sub}>Then say your first few sentences.</Text>
          </View>

          <View style={styles.form}>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
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
              placeholder="At least 8 characters"
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            <Text style={[styles.rule, passwordValid && styles.ruleMet]}>
              {passwordValid ? '●' : '○'}  At least 8 characters
            </Text>

            {banner ? <Banner>{banner}</Banner> : null}
          </View>

          <View style={styles.actions}>
            <GradientButton
              label="Create account"
              onPress={submit}
              loading={busy}
              disabled={!emailValid || !passwordValid}
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace({ pathname: '/(auth)/login', params: { email } })}>
              <Text style={styles.footer}>
                Already have an account? <Text style={styles.link}>Log in</Text>
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
  rule: { ...Type.caption, color: Colors.muted },
  ruleMet: { color: Colors.mint },
  actions: { gap: Layout.gap },
  footer: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  link: { color: Colors.violetDeep },
});
