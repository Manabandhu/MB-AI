import type { Href } from 'expo-router';
import { Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { ONBOARDING_START } from '@/modules/auth/utils/postAuth';
import { confirmSignOut } from '@/modules/foundation/account/signOut';
import { useMapPreferencesStore } from '@/modules/shared/stores/mapPreferencesStore';
import {
  AppButton,
  AppText,
  Avatar,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  Section,
  SegmentedControl,
  StatusBadge,
} from '@/modules/shared/ui';

/** Apple Maps exists only on iOS; everywhere else the app draws Google Maps. */
const APPLE_MAPS_AVAILABLE = Platform.OS === 'ios';

const MAP_OPTIONS = [
  { value: 'google', label: 'Google Maps', icon: 'map' },
  { value: 'apple', label: 'Apple Maps', icon: 'map-pin' },
] as const;

/**
 * Settings: the member's account, notifications, maps, safety, and legal pages, then sign out (confirmed first).
 * Each destination appears once.
 */
export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const mapProvider = useMapPreferencesStore((s) => s.provider);
  const setMapProvider = useMapPreferencesStore((s) => s.setProvider);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Member';
  const contact = user?.email ?? user?.phone ?? null;

  return (
    <Screen maxWidth="form">
      <ScreenHeader back={{ fallback: '/profile' as Href }} title="Settings" />

      <Card variant="elevated">
        <XStack alignItems="center" gap="$x4">
          <Avatar
            imageUrl={user?.user_metadata?.avatar_url as string | undefined}
            name={displayName}
            size="lg"
          />
          <YStack flex={1} gap="$x1" minWidth={0}>
            <AppText numberOfLines={1} variant="bodyStrong">
              {displayName}
            </AppText>
            {contact ? (
              <AppText numberOfLines={1} tone="muted" variant="caption">
                {contact}
              </AppText>
            ) : null}
            {user?.email_confirmed_at ? (
              <XStack>
                <StatusBadge icon="verified-user" label="Email verified" tone="success" />
              </XStack>
            ) : null}
          </YStack>
        </XStack>
      </Card>

      <Section title="Account">
        <YStack gap="$x2">
          <ListRow
            href="/settings/account"
            icon="user"
            subtitle="Sign-in details, download your data, delete account"
            title="Account & data"
          />
          <ListRow
            href="/notifications/settings"
            icon="bell"
            subtitle="Channels, module alerts, and quiet hours"
            title="Notification settings"
            tone="teal"
          />
        </YStack>
      </Section>

      <Section
        subtitle={
          APPLE_MAPS_AVAILABLE
            ? 'Used for room, ride, and event maps on this device.'
            : 'Maps on this device use Google Maps.'
        }
        title="Maps"
      >
        {APPLE_MAPS_AVAILABLE ? (
          <SegmentedControl
            label="Preferred map service"
            onChange={setMapProvider}
            options={MAP_OPTIONS}
            value={mapProvider}
          />
        ) : null}
      </Section>

      <Section title="Safety">
        <ListRow
          href="/safety"
          icon="shield"
          subtitle="Trusted contacts, blocked members, and emergency resources"
          title="Safety Center"
          tone="danger"
        />
      </Section>

      <Section title="About & help">
        <YStack gap="$x2">
          <ListRow href="/terms" icon="shield" title="Terms of Service" tone="teal" />
          <ListRow href="/privacy" icon="lock" title="Privacy Policy" tone="teal" />
          <ListRow
            href={ONBOARDING_START as string}
            icon="sparks"
            subtitle="Update your goals, interests, languages, and city"
            title="Redo onboarding"
          />
        </YStack>
      </Section>

      <AppButton
        icon="logout"
        label="Sign out"
        onPress={() => void confirmSignOut()}
        variant="ghost"
      />
    </Screen>
  );
}
