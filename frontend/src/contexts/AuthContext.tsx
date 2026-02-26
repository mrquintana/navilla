import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import {
  E2E_MODE,
  getE2eUserByEmail,
  makeE2eAccessToken,
  verifyE2ePassword,
} from '../lib/e2eMocks';

export interface UserMetadata {
  username: string;
  fullName?: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'other';
  country?: string;
  location?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    if (!E2E_MODE) return null;
    const email = localStorage.getItem('navilla.e2e.email');
    return email ? buildE2eSession(email) : null;
  });
  const [isLoading, setIsLoading] = useState(!E2E_MODE);

  useEffect(() => {
    if (E2E_MODE) return undefined;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (E2E_MODE) {
      const user = getE2eUserByEmail(email);
      if (!user || !verifyE2ePassword(password)) {
        return { error: { message: 'Invalid credentials' } as AuthError };
      }
      const e2eSession = buildE2eSession(email);
      localStorage.setItem('navilla.e2e.email', email.toLowerCase());
      setSession(e2eSession);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata: UserMetadata) => {
    if (E2E_MODE) {
      if (!verifyE2ePassword(password)) {
        return { error: { message: 'Password does not meet requirements' } as AuthError, needsEmailConfirmation: false };
      }
      const e2eSession = buildE2eSession(email, metadata);
      localStorage.setItem('navilla.e2e.email', email.toLowerCase());
      setSession(e2eSession);
      return { error: null, needsEmailConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    // If user is auto-confirmed (no email verification required), session will exist
    const needsEmailConfirmation = !error && !data.session;
    if (!error && data.session) {
      try {
        await api.users.update(data.session.access_token, {
          displayName: metadata.fullName ?? metadata.username,
          fullName: metadata.fullName,
          username: metadata.username,
          sex: metadata.sex,
          dateOfBirth: metadata.dateOfBirth,
          country: metadata.country,
          location: metadata.location,
        });
      } catch {
        // Avoid blocking signup if profile sync fails
      }
    }
    return { error, needsEmailConfirmation };
  };

  const signOut = async () => {
    if (E2E_MODE) {
      localStorage.removeItem('navilla.e2e.email');
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function buildE2eSession(email: string, metadata?: UserMetadata): Session {
  const user = getE2eUserByEmail(email);
  const now = Math.floor(Date.now() / 1000);

  return {
    access_token: makeE2eAccessToken(email),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: user?.id ?? `e2e-${email.toLowerCase()}`,
      aud: 'authenticated',
      role: 'authenticated',
      email: email.toLowerCase(),
      app_metadata: {},
      user_metadata: {
        full_name: metadata?.fullName ?? user?.displayName,
        username: metadata?.username ?? user?.username,
      },
      created_at: new Date().toISOString(),
    },
  } as Session;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthOptional() {
  return useContext(AuthContext);
}
