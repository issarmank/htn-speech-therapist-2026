import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api, configureClient } from '@/features/api/client';
import { ApiError, type AuthUser } from '@/features/api/contracts';

import { tokenStore } from './token-store';

type AuthState = {
  status: 'loading' | 'signedIn' | 'signedOut';
  user: AuthUser | null;
  /** Falls back to the cached email when /auth/me could not be reached. */
  email: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // A ref, not state: the client reads this synchronously on every request.
  const tokenRef = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    setEmail(null);
    setStatus('signedOut');
    await tokenStore.clear();
  }, []);

  // Registered once so client.ts never imports this module back.
  useEffect(() => {
    configureClient({
      readToken: () => tokenRef.current,
      onUnauthorized: () => {
        void signOut();
      },
    });
  }, [signOut]);

  // Launch gate.
  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await tokenStore.read();
      if (!active) return;

      if (!stored.token) {
        setStatus('signedOut');
        return;
      }

      tokenRef.current = stored.token;
      setEmail(stored.email);

      try {
        const me = await api.me();
        if (!active) return;
        setUser(me);
        setEmail(me.email);
        setStatus('signedIn');
      } catch (error) {
        if (!active) return;
        // 401 means the 60-minute token expired — the client's own handler has
        // already signed us out. Anything else is the network, and holding a
        // valid token hostage to a flaky connection is worse than letting the
        // user in on the cached email and retrying lazily.
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') return;
        setStatus('signedIn');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (nextEmail: string, password: string) => {
    const { access_token } = await api.login(nextEmail, password);
    tokenRef.current = access_token;
    await tokenStore.save(access_token, nextEmail);
    setEmail(nextEmail);
    setStatus('signedIn');

    // Non-blocking: a successful login is enough to enter the app.
    api
      .me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const signUp = useCallback(
    async (nextEmail: string, password: string) => {
      // Register returns the user but no token, so a login always follows.
      await api.register(nextEmail, password);
      await signIn(nextEmail, password);
    },
    [signIn],
  );

  return (
    <AuthContext.Provider value={{ status, user, email, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
