import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';
import { User } from '../api/types';

const TOKEN_STORAGE_KEY = 'auth_token';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!storedToken) {
          return;
        }
        setAuthToken(storedToken);
        setUser(await api.auth.me());
      } catch {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (token: string, sessionUser: User) => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setUser(sessionUser);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { token, user: sessionUser } = await api.auth.login({ email, password });
      await persistSession(token, sessionUser);
    },
    [persistSession]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
