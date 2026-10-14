import { Switch } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

type Props = {
  icon: AppIconName;
  title: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

/** A labelled switch row. The whole row is one accessible switch so screen readers announce its state. */
export function SettingRow({ icon, title, description, value, disabled, onChange }: Props) {
  const { palette } = useAppearance();
  return (
    <XStack
      alignItems="center"
      aria-checked={value}
      aria-disabled={disabled}
      aria-label={description ? `${title}. ${description}` : title}
      cursor={disabled ? 'default' : 'pointer'}
      gap="$x3"
      minHeight={56}
      onPress={disabled ? undefined : () => onChange(!value)}
      {...keyboardPress(() => onChange(!value), !disabled)}
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      opacity={disabled ? 0.5 : 1}
      paddingVertical="$x2"
      role="switch"
    >
      <YStack
        alignItems="center"
        backgroundColor="$primaryTint"
        borderRadius="$control"
        height={36}
        justifyContent="center"
        width={36}
      >
        <AppIcon color={palette.primary} name={icon} size={18} />
      </YStack>
      <YStack flex={1} gap={2}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText tone="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </YStack>
      <Switch
        accessibilityElementsHidden
        disabled={disabled}
        importantForAccessibility="no-hide-descendants"
        onValueChange={onChange}
        thumbColor={palette.surface}
        // react-native-web colours the "on" thumb separately.
        {...({ activeThumbColor: palette.surface } as object)}
        trackColor={{ false: palette.border, true: palette.primary }}
        value={value}
      />
    </XStack>
  );
}
