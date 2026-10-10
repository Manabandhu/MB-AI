import { useTheme, XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';

type ChipProps = {
  label: string;
  icon?: AppIconName;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Filter, category, and status pill. Selectable chips expose their state to assistive tech. */
export function Chip({ label, icon, selected, onPress, accessibilityLabel }: ChipProps) {
  const theme = useTheme();
  const color = selected ? '$onPrimary' : '$primary';
  return (
    <XStack
      aria-label={accessibilityLabel ?? label}
      role={onPress ? 'button' : undefined}
      aria-pressed={onPress ? Boolean(selected) : undefined}
      alignItems="center"
      backgroundColor={selected ? '$primary' : '$primaryTint'}
      borderColor={selected ? '$primary' : '$primarySoft'}
      borderRadius="$pill"
      borderWidth={1}
      cursor={onPress ? 'pointer' : undefined}
      focusable={Boolean(onPress)}
      gap="$x1"
      hoverStyle={onPress ? { borderColor: '$primary' } : undefined}
      minHeight={onPress ? 36 : 28}
      onPress={onPress}
      paddingHorizontal="$x3"
    >
      {icon ? (
        <AppIcon
          color={selected ? theme.onPrimary?.val : theme.primary?.val}
          name={icon}
          size={14}
        />
      ) : null}
      <AppText color={color} numberOfLines={1} variant="caption">
        {label}
      </AppText>
    </XStack>
  );
}
