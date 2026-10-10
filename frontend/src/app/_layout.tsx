import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import '../../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { useAuthStore } from '@/lib/authStore';
import { AppThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 2, staleTime: 30_000 },
        },
      }),
  );

  // Cached queries hold one member's data; drop them whenever the signed-in account changes or signs out.
  useEffect(() => {
    let previousUserId = useAuthStore.getState().user?.id ?? null;
    return useAuthStore.subscribe((state) => {
      const userId = state.user?.id ?? null;
      if (userId !== previousUserId) {
        if (previousUserId !== null) queryClient.clear();
        previousUserId = userId;
      }
    });
  }, [queryClient]);

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => undefined);
    useAuthStore
      .getState()
      .checkSession()
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </AppThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>
  );
}
