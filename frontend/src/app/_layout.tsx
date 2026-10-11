import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { type Href, router, Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import '../../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { persistOptions, queryPersister } from '@/lib/queryPersistence';
import { useOpenPushTaps } from '@/modules/notifications/push';
import { ConfirmProvider } from '@/modules/shared/ui/ConfirmSheet';
import { AppThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  useOpenPushTaps(useCallback((route: string) => router.push(route as Href), []));
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
        if (previousUserId !== null) {
          queryClient.clear();
          Promise.resolve(queryPersister.removeClient()).catch(() => undefined);
        }
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
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <ConfirmProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ConfirmProvider>
          </PersistQueryClientProvider>
        </AppThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>
  );
}
