import { useTheme, XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';

/**
 * Selectable pill with a 44pt touch target (the shared `Chip` is 36pt). Exposes its selected state to assistive
 * tech as a toggle button (`aria-pressed`), or as a radio when `radio` is set.
 */
export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  accessibilityLabel,
  radio,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: AppIconName;
  accessibilityLabel?: string;
  /** One-of-many choice: announced as a radio with `aria-checked`. */
  radio?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <XStack
      alignItems="center"
      aria-checked={radio ? selected : undefined}
      aria-disabled={disabled || undefined}
      aria-label={accessibilityLabel ?? label}
      aria-pressed={radio ? undefined : selected}
      backgroundColor={selected ? '$primary' : '$primaryTint'}
      borderColor={selected ? '$primary' : '$primarySoft'}
      borderRadius="$pill"
      borderWidth={1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable={!disabled}
      gap="$x1"
      hoverStyle={{ borderColor: '$primary' }}
      minHeight="$touch"
      onPress={disabled ? undefined : onPress}
      opacity={disabled ? 0.5 : 1}
      paddingHorizontal="$x4"
      pressStyle={{ opacity: 0.85 }}
      role={radio ? 'radio' : 'button'}
    >
      {icon ? (
        <AppIcon
          color={selected ? theme.onPrimary?.val : theme.primary?.val}
          name={icon}
          size={16}
        />
      ) : null}
      <AppText color={selected ? '$onPrimary' : '$primary'} numberOfLines={1} variant="label">
        {label}
      </AppText>
    </XStack>
  );
}
