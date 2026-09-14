import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import '../../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { useAuthStore } from '@/lib/authStore';
import { GluestackUIProvider } from '@/modules/shared/ui/gluestack/gluestack-ui-provider';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 2, staleTime: 30_000 },
        },
      }),
  );

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
        <GluestackUIProvider mode="light">
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>
  );
}
