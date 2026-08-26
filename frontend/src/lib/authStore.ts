import { type Session, type User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInWithEmailOtp: (email: string) => Promise<void>;
  verifyOtp: (emailOrPhone: string, token: string, type: 'email' | 'sms') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  _setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  session: null,
  user: null,
  status: 'loading',
  isLoading: true,
  error: null,

  checkSession: async () => {
    set({ isLoading: true, status: 'loading' });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        set({
          error: sessionError.message,
          status: 'unauthenticated',
          isLoading: false,
        });
        return;
      }
      if (data.session) {
        set({
          session: data.session,
          user: data.session.user,
          status: 'authenticated',
          isLoading: false,
        });
      } else {
        set({
          session: null,
          user: null,
          status: 'unauthenticated',
          isLoading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to check session';
      set({ error: message, status: 'unauthenticated', isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({
        session: data.session,
        user: data.user ?? null,
        status: 'authenticated',
        isLoading: false,
      });
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: message, status: 'unauthenticated', isLoading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: name ? { data: { full_name: name } } : undefined,
      });
      if (error) throw error;
      if (data.session) {
        set({
          session: data.session,
          user: data.user ?? null,
          status: 'authenticated',
          isLoading: false,
        });
        router.replace('/home');
      } else {
        set({
          session: null,
          user: data.user ?? null,
          status: 'unauthenticated',
          isLoading: false,
        });
        router.replace('/sign-in');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message, status: 'unauthenticated', isLoading: false });
    }
  },

  signInWithPhone: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      set({ isLoading: false });
      router.push('/otp-verification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS sending failed';
      set({ error: message, isLoading: false });
    }
  },

  signInWithEmailOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Magic link sending failed';
      set({ error: message, isLoading: false });
    }
  },

  verifyOtp: async (emailOrPhone, token, type) => {
    set({ isLoading: true, error: null });
    try {
      const payload =
        type === 'email'
          ? { email: emailOrPhone, token, type: 'email' as const }
          : { phone: emailOrPhone, token, type: 'sms' as const };
      const { data, error } = await supabase.auth.verifyOtp(payload);
      if (error) throw error;
      set({
        session: data.session ?? null,
        user: data.user ?? null,
        status: 'authenticated',
        isLoading: false,
      });
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      set({ error: message, isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset email sending failed';
      set({ error: message, isLoading: false });
    }
  },

  updatePassword: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      set({ isLoading: false });
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      set({ error: message, isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({
        session: null,
        user: null,
        status: 'unauthenticated',
        isLoading: false,
      });
      router.replace('/sign-in');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  _setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
      isLoading: false,
    });
  },
}));

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState()._setSession(session);
});

export function useRedirectIfAuthenticated(redirectTo = '/home') {
  const { status, isLoading } = useAuthStore();
  const shouldRedirect = status === 'authenticated' && !isLoading;
  useEffect(() => {
    if (shouldRedirect) router.replace(redirectTo as never);
  }, [shouldRedirect, redirectTo]);
  return { isChecked: !isLoading, shouldRedirect };
}

export function useRequireAuth(redirectTo = '/sign-in') {
  const { session, status, isLoading } = useAuthStore();
  const shouldRedirect = status === 'unauthenticated' && !isLoading;
  useEffect(() => {
    if (shouldRedirect) router.replace(redirectTo as never);
  }, [shouldRedirect, redirectTo]);
  return { session, status, isLoading, shouldRedirect };
}

export function useAuthStatus() {
  return useAuthStore((state) => ({
    session: state.session,
    user: state.user,
    status: state.status,
    isLoading: state.isLoading,
    error: state.error,
  }));
}
