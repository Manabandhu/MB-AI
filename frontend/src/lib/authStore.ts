import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { getIdentity } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { parseAuthRedirect } from '@/modules/auth/authHelpers';
import { routeAfterAuth } from '@/modules/auth/postAuth';
import { clearSavedRooms } from '@/modules/rooms/savedRoomsStore';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  identity: IdentityResponse | null;
  needsEmailConfirmation: boolean;
  otpIdentifier: string | null;
  otpType: 'email' | 'sms' | null;
}

export interface IdentityResponse {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the account still needs its email confirmed before a session exists. */
  signUp: (
    email: string,
    password: string,
    name?: string,
    termsVersion?: string,
  ) => Promise<boolean>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInWithEmailOtp: (email: string) => Promise<void>;
  /** On native resolves once the in-app browser returns; on web the page navigates to the provider. */
  signInWithOAuth: (provider: 'apple' | 'google') => Promise<void>;
  verifyOtp: (emailOrPhone: string, token: string, type: 'email' | 'sms') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  /** Saves the name we greet the member by (auth user metadata `nickname`). Throws on failure. */
  updateNickname: (nickname: string) => Promise<void>;
  /** Saves profile fields (for example `avatar_url`) to the account's metadata; throws on failure. */
  updateProfile: (fields: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  loadIdentity: () => Promise<void>;
  clearError: () => void;
  clearOtpContext: () => void;
  setSession: (session: Session | null) => void;
  _setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()((set, _get) => ({
  session: null,
  user: null,
  status: 'loading',
  isLoading: true,
  error: null,
  identity: null,
  needsEmailConfirmation: false,
  otpIdentifier: null,
  otpType: null,

  checkSession: async () => {
    set({ isLoading: true, status: 'loading' });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        set({
          error: sessionError.message,
          status: 'unauthenticated',
          isLoading: false,
          identity: null,
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
        await _get().loadIdentity();
      } else {
        set({
          session: null,
          user: null,
          identity: null,
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
    set({ isLoading: true, error: null, needsEmailConfirmation: false });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.session?.user) {
        await _get().loadIdentity();
        set({
          session: data.session,
          user: data.user,
          status: 'authenticated',
          isLoading: false,
          error: null,
        });
      } else {
        set({
          session: data.session ?? null,
          user: data.user ?? null,
          status: 'unauthenticated',
          isLoading: false,
          error: 'Sign in failed: invalid credentials or session',
        });
        throw new Error('Sign in failed: invalid credentials or session');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: message, status: 'unauthenticated', isLoading: false });
      throw err;
    }
  },

  signUp: async (email, password, name, termsVersion) => {
    set({ isLoading: true, error: null, needsEmailConfirmation: false });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // The accepted terms version is kept on the account as the record of consent.
        options: {
          data: {
            ...(name ? { full_name: name } : {}),
            ...(termsVersion
              ? { terms_version: termsVersion, terms_accepted_at: new Date().toISOString() }
              : {}),
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        await _get().loadIdentity();
        set({
          session: data.session,
          user: data.user,
          status: 'authenticated',
          needsEmailConfirmation: false,
          isLoading: false,
          error: null,
        });
        return false;
      }
      set({
        session: null,
        user: data.user ?? null,
        identity: null,
        status: 'unauthenticated',
        needsEmailConfirmation: true,
        isLoading: false,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message, status: 'unauthenticated', isLoading: false });
      throw err;
    }
  },

  signInWithPhone: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      set({ otpIdentifier: phone, otpType: 'sms', isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS sending failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signInWithEmailOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      set({ otpIdentifier: email, otpType: 'email', isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Magic link sending failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signInWithOAuth: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      if (Platform.OS === 'web') {
        const redirectTo =
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        if (error) throw error;
        if (data?.url && typeof window !== 'undefined') window.location.href = data.url;
        set({ isLoading: false });
        return;
      }
      // Native: open the provider in an in-app browser session and bring the tokens back through the app scheme.
      // The redirect (manabandhu://auth/callback) must be listed in Supabase Auth's allowed redirect URLs.
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        set({ isLoading: false });
        return;
      }
      const parsed = parseAuthRedirect(result.url);
      if (parsed.kind === 'error') throw new Error(parsed.message);
      if (parsed.kind === 'session') {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken,
        });
        if (sessionError) throw sessionError;
      } else if (parsed.kind === 'code') {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
        if (exchangeError) throw exchangeError;
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : `${provider} sign-in failed`;
      set({ error: message, isLoading: false });
      throw err;
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
      if (data.session?.user) {
        await _get().loadIdentity();
      }
      _get().setSession(data.session ?? null);
      set({
        otpIdentifier: null,
        otpType: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      // The link opens the reset screen on the web or, in the app, through the manabandhu:// scheme.
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : Linking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset email sending failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updatePassword: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateProfile: async (fields) => {
    const { data, error } = await supabase.auth.updateUser({ data: fields });
    if (error) throw error;
    if (data.user) set({ user: data.user });
  },

  updateNickname: async (nickname) => {
    // Does not touch `isLoading`/`status`: a profile edit must never look like a sign-in transition.
    const { data, error } = await supabase.auth.updateUser({ data: { nickname } });
    if (error) throw error;
    if (data.user) set({ user: data.user });
  },

  /**
   * Ends the session and is the only place that navigates afterwards (to /welcome), so callers never double-route.
   * Rejects when Supabase refuses, leaving the member signed in; callers show the error.
   */
  signOut: async () => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
    set({
      session: null,
      user: null,
      identity: null,
      status: 'unauthenticated',
      isLoading: false,
    });
    // Per-user caches must not leak to the next person who signs in on this device.
    clearSavedRooms();
    router.replace('/welcome');
  },

  loadIdentity: async () => {
    try {
      const identity = await getIdentity();
      set({ identity });
    } catch {
      set({ identity: null });
    }
  },

  clearError: () => set({ error: null, needsEmailConfirmation: false }),

  clearOtpContext: () => set({ otpIdentifier: null, otpType: null }),

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
      isLoading: false,
    });
  },

  _setSession: (session) => {
    _get().setSession(session);
  },
}));

supabase.auth.onAuthStateChange(async (_event, session) => {
  const store = useAuthStore.getState();
  store._setSession(session);
  if (session) {
    await store.loadIdentity();
  } else {
    useAuthStore.setState({ identity: null, needsEmailConfirmation: false });
  }
});

/**
 * Sends a signed-in member away from sign-in style screens: to onboarding until it is complete, then Home.
 * Every auth screen relies on this after a successful sign-in, so navigation happens in one place.
 */
export function useRedirectIfAuthenticated() {
  const { status, isLoading } = useAuthStore();
  const shouldRedirect = status === 'authenticated' && !isLoading;
  const redirected = useRef(false);
  useEffect(() => {
    if (shouldRedirect && !redirected.current) {
      redirected.current = true;
      void routeAfterAuth();
    }
    if (!shouldRedirect) redirected.current = false;
  }, [shouldRedirect]);
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
    identity: state.identity,
    needsEmailConfirmation: state.needsEmailConfirmation,
  }));
}
