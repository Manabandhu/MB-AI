import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';

export function AuthCallbackScreen() {
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const { status } = useAuthStore();

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url.includes('code=')) {
      void supabase.auth.exchangeCodeForSession(url).then(({ error }) => {
        if (error) setExchangeError(error.message);
      });
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (status === 'unauthenticated' && exchangeError == null) {
      timer = setInterval(() => {}, 1000);
    }
    return () => clearInterval(timer);
  }, [status, exchangeError]);

  if (exchangeError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Confirmation failed</Text>
          <Text style={styles.body}>{exchangeError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Confirming your email…</Text>
        <Text style={styles.body}>Please wait while we verify your account.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#FFFFFF', flex: 1 },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
});
