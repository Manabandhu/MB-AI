import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { signOutWithFeedback } from '@/modules/foundation/account/signOut';
import { AppearanceSettings } from '@/modules/foundation/settings/AppearanceSettings';
import { useMapPreferencesStore } from '@/modules/shared/stores/mapPreferencesStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const { provider, setProvider } = useMapPreferencesStore();
  return (
    <Screen maxWidth="form">
      <ScreenHeader
        title="Settings"
        subtitle="Manage your account, appearance, and preferences."
        back={{ fallback: '/profile' }}
      />
      <Section title="Look, feel & language">
        <AppearanceSettings />
      </Section>
      <Section title="Account & privacy">
        <ListRow
          title="Account & data"
          subtitle="Update your details, export data, or delete your account"
          href="/settings/account"
          icon="user"
        />
        <ListRow
          title="Notifications"
          subtitle="Choose what reaches you, and when"
          href="/notifications/settings"
          icon="bell"
        />
      </Section>
      <Section title="Maps">
        <SegmentedControl
          label="Preferred map service"
          value={provider}
          onChange={(value) => setProvider(value as 'google' | 'apple')}
          options={[
            { value: 'google', label: 'Google Maps' },
            { value: 'apple', label: 'Apple Maps' },
          ]}
        />
        <AppText tone="muted" variant="caption">
          Available maps depend on your device and provider configuration.
        </AppText>
      </Section>
      <Section title="Safety & support">
        <ListRow
          title="Safety center"
          subtitle="Trusted contacts, reporting, and emergency resources"
          href="/safety"
          icon="shield"
          tone="teal"
        />
        <ListRow title="Terms of service" href="/terms" icon="book" />
        <ListRow title="Privacy policy" href="/privacy" icon="lock" />
      </Section>
      {user ? (
        <YStack paddingVertical="$x4">
          <AppButton
            label="Sign out"
            icon="logout"
            variant="ghost"
            onPress={() => void signOutWithFeedback()}
          />
        </YStack>
      ) : null}
    </Screen>
  );
}
