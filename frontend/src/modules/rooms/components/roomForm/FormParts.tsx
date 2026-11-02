import type { ReactNode } from 'react';
import { Switch } from 'react-native';
import { XStack, YStack } from 'tamagui';
import type { useImageUpload } from '@/modules/shared/hooks/useImageUpload';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useAppearance } from '@/theme/ThemeProvider';

// Layout pieces used by the room listing form sections.
export function FormSection({
  icon,
  title,
  children,
}: {
  icon: AppIconName;
  title: string;
  children: ReactNode;
}) {
  const { palette } = useAppearance();
  return (
    <Card gap="$x3" variant="outlined">
      <XStack alignItems="center" gap="$x2">
        <AppIcon color={palette.primary} name={icon} size={20} />
        <AppText role="heading" variant="h4">
          {title}
        </AppText>
      </XStack>
      {children}
    </Card>
  );
}

/** Two fields side by side on wider windows, stacked on phones. */
export function FieldPair({ wide, children }: { wide: boolean; children: ReactNode }) {
  return wide ? (
    <XStack alignItems="flex-start" gap="$x3">
      {children}
    </XStack>
  ) : (
    <YStack gap="$x4">{children}</YStack>
  );
}

export function ChipGroup({
  label,
  radio,
  children,
}: {
  label: string;
  /** One-of-many choice: the chips are `radio` and the group a `radiogroup`. */
  radio?: boolean;
  children: ReactNode;
}) {
  return (
    <YStack gap="$x2">
      <AppText variant="label">{label}</AppText>
      <XStack aria-label={label} flexWrap="wrap" gap="$x2" role={radio ? 'radiogroup' : 'group'}>
        {children}
      </XStack>
    </YStack>
  );
}

/** Yes/no setting with a real switch; the label names the switch for screen readers. */
export function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { palette } = useAppearance();
  return (
    <XStack
      alignItems="center"
      backgroundColor="$surfaceContainerLow"
      borderRadius="$control"
      gap="$x3"
      minHeight={52}
      padding="$x3"
    >
      <YStack flex={1} gap={2}>
        <AppText variant="label">{label}</AppText>
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      </YStack>
      <Switch
        accessibilityHint={description}
        accessibilityLabel={label}
        onValueChange={onToggle}
        thumbColor={palette.surface}
        // react-native-web colours the "on" thumb separately.
        {...({ activeThumbColor: palette.surface } as object)}
        trackColor={{ false: palette.border, true: palette.primary }}
        value={value}
      />
    </XStack>
  );
}

export function UploadStatus({
  state,
  onCancel,
  onDismiss,
}: {
  state: ReturnType<typeof useImageUpload>['state'];
  onCancel: () => void;
  onDismiss: () => void;
}) {
  if (state.status === 'picking') {
    return (
      <AppText aria-live="polite" tone="muted" variant="caption">
        Choose a photo…
      </AppText>
    );
  }
  if (state.status === 'uploading') {
    return (
      <XStack alignItems="center" aria-live="polite" gap="$x3">
        <YStack backgroundColor="$surfaceContainerLow" borderRadius="$pill" flex={1} height={8}>
          <YStack
            backgroundColor="$primary"
            borderRadius="$pill"
            height={8}
            width={`${Math.max(4, state.progress)}%`}
          />
        </YStack>
        <AppText variant="caption">{state.progress}%</AppText>
        <AppButton label="Cancel" onPress={onCancel} size="sm" variant="ghost" />
      </XStack>
    );
  }
  if (state.status === 'error') {
    return (
      <XStack alignItems="center" aria-live="polite" gap="$x2">
        <AppText flex={1} tone="danger" variant="caption">
          {state.message}
        </AppText>
        <AppButton label="Dismiss" onPress={onDismiss} size="sm" variant="ghost" />
      </XStack>
    );
  }
  return null;
}
