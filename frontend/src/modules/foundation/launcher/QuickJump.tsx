import { type Href, router } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList, Platform, type TextInput } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { screenCatalog } from '@/modules/screen-catalog';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';
import { navigableDestinations, searchDestinations } from './commandSearch';
import { launcherModules } from './moduleRegistry';

const JumpContext = createContext<() => void>(() => undefined);
export const useQuickJump = () => useContext(JumpContext);
const allDestinations = screenCatalog.flatMap((group) =>
  group.screens.map((screen) => ({ ...screen, module: group.module })),
);
const defaultRoutes = [
  '/search',
  '/saved',
  '/rooms',
  '/rides',
  '/jobs',
  '/events',
  '/explore',
  '/settings',
];
const categoryIcons: Record<string, AppIconName> = {
  foundation: 'compass',
  notifications: 'bell',
  admin: 'shield',
  'ai-assistant': 'sparks',
};

/** One catalog-backed launcher for every screen; no network request is needed to find a destination. */
export function QuickJumpProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<TextInput>(null);
  const user = useAuthStore((state) => state.user);
  const { palette } = useAppearance();
  const roles = user?.app_metadata?.roles;
  const isSuperAdmin = Array.isArray(roles) && roles.includes('SUPER_ADMIN');
  const isAdmin = isSuperAdmin || (Array.isArray(roles) && roles.includes('ADMIN'));
  const destinations = useMemo(
    () => navigableDestinations(allDestinations, isAdmin, isSuperAdmin),
    [isAdmin, isSuperAdmin],
  );
  const results = useMemo(
    () =>
      query.trim()
        ? searchDestinations(destinations, query)
        : defaultRoutes.flatMap((route) => destinations.filter((item) => item.route === route)),
    [destinations, query],
  );
  const open = useCallback(() => {
    setQuery('');
    setVisible(true);
  }, []);
  const close = useCallback(() => setVisible(false), []);
  const navigate = (route: string) => {
    close();
    router.push(route as Href);
  };

  useEffect(() => {
    if (!user) setVisible(false);
  }, [user]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !user) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuery('');
        setVisible((value) => !value);
      }
      if (event.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [user]);
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const timeout = setTimeout(() => input.current?.focus(), 120);
    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <JumpContext.Provider value={open}>
      {children}
      <BottomSheet
        visible={visible}
        onClose={close}
        title={t('navigation.title')}
        subtitle={t('navigation.subtitle')}
        size="tall"
      >
        <YStack flex={1} gap="$x3">
          <TextField
            ref={input}
            label={t('navigation.label')}
            leadingIcon="search"
            placeholder={t('navigation.placeholder')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => {
              if (results.length === 1) navigate(results[0].route);
            }}
            trailing={
              query ? (
                <IconButton
                  icon="close"
                  label={t('navigation.clear')}
                  onPress={() => {
                    setQuery('');
                    input.current?.focus();
                  }}
                  variant="plain"
                />
              ) : undefined
            }
          />
          <AppText aria-live="polite" tone="muted" variant="caption">
            {query.trim()
              ? t('navigation.count', { count: results.length })
              : t('navigation.shortcuts')}
          </AppText>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            ListEmptyComponent={
              <EmptyState
                compact
                title={t('navigation.emptyTitle')}
                body={t('navigation.emptyBody')}
                iconName="search"
              />
            }
            renderItem={({ item }) => {
              const icon =
                launcherModules.find((module) => module.key === item.module)?.icon ??
                categoryIcons[item.module] ??
                'compass';
              return (
                <Card
                  aria-label={`Open ${item.title}`}
                  href={item.route}
                  onPress={() => navigate(item.route)}
                  padding="$x3"
                >
                  <XStack alignItems="center" gap="$x3">
                    <YStack backgroundColor="$primaryTint" borderRadius="$control" padding="$x3">
                      <AppIcon name={icon} color={palette.primary} size={20} />
                    </YStack>
                    <YStack flex={1} minWidth={0}>
                      <AppText variant="bodyStrong">{item.title}</AppText>
                      <AppText tone="muted" variant="caption">
                        {item.module === 'foundation'
                          ? t('navigation.yourSpace')
                          : item.module.replaceAll('-', ' ')}
                      </AppText>
                    </YStack>
                    <AppIcon name="arrow-right" color={palette.muted} size={18} />
                  </XStack>
                </Card>
              );
            }}
          />
        </YStack>
      </BottomSheet>
    </JumpContext.Provider>
  );
}
