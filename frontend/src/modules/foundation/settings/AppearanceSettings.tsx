import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { useAppearanceStore } from '@/theme/themePreferenceStore';

/** Theme (system / light / dark) and animation level. Saved on this device only. */
export function AppearanceSettings() {
  const theme = useAppearanceStore((s) => s.theme);
  const motion = useAppearanceStore((s) => s.motion);
  const setTheme = useAppearanceStore((s) => s.setTheme);
  const setMotion = useAppearanceStore((s) => s.setMotion);
  return (
    <YStack gap="$x4">
      <YStack gap="$x2">
        <AppText variant="label">Theme</AppText>
        <SegmentedControl
          label="Theme"
          onChange={setTheme}
          options={[
            { value: 'system', label: 'System', icon: 'monitor' },
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
          value={theme}
        />
      </YStack>
      <YStack gap="$x2">
        <AppText variant="label">Animations</AppText>
        <SegmentedControl
          label="Animations"
          onChange={setMotion}
          options={[
            { value: 'full', label: 'Full' },
            { value: 'reduced', label: 'Reduced' },
            { value: 'off', label: 'Off' },
          ]}
          value={motion}
        />
        <AppText tone="muted" variant="caption">
          Your device's reduce-motion setting always limits animations.
        </AppText>
      </YStack>
    </YStack>
  );
}
