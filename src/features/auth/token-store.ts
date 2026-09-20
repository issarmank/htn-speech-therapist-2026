import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'vocalflow.token';
const EMAIL_KEY = 'vocalflow.email';

/**
 * expo-secure-store has no web implementation — its native module there is a
 * bare `{}`, so `setItemAsync` throws `setValueWithKeyAsync is not a function`.
 * That threw straight out of `signIn`, and because it is not an ApiError the
 * auth screens rendered it as "Couldn't reach the server" even though the login
 * request had already returned 200.
 *
 * On web the token falls back to AsyncStorage (localStorage). It is no better
 * protected than any other browser-held credential, which is the ceiling the
 * platform offers; native keeps the keychain.
 */
const backing =
  Platform.OS === 'web'
    ? {
        get: (key: string) => AsyncStorage.getItem(key),
        set: (key: string, value: string) => AsyncStorage.setItem(key, value),
        remove: (key: string) => AsyncStorage.removeItem(key),
      }
    : {
        get: (key: string) => SecureStore.getItemAsync(key),
        set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        remove: (key: string) => SecureStore.deleteItemAsync(key),
      };

/**
 * The token never goes in AsyncStorage on a device. The cached email is not a
 * secret but lives here too so both clear together on log out.
 */
export const tokenStore = {
  async read(): Promise<{ token: string | null; email: string | null }> {
    try {
      const [token, email] = await Promise.all([backing.get(TOKEN_KEY), backing.get(EMAIL_KEY)]);
      return { token, email };
    } catch {
      // A keychain read can fail on a wiped or locked device. Treat it as
      // signed out rather than crashing the launch path.
      return { token: null, email: null };
    }
  },

  async save(token: string, email: string): Promise<void> {
    try {
      await backing.set(TOKEN_KEY, token);
      await backing.set(EMAIL_KEY, email);
    } catch (error) {
      // Persistence is a convenience: auth-context already holds the token in
      // memory, so the session works for this launch. Never let a storage
      // failure surface as a failed sign-in.
      console.warn('[auth] could not persist the session token', error);
    }
  },

  async clear(): Promise<void> {
    await Promise.all([
      backing.remove(TOKEN_KEY).catch(() => {}),
      backing.remove(EMAIL_KEY).catch(() => {}),
    ]);
  },
};
