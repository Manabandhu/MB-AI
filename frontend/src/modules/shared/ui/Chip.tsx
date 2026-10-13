import { useTheme, XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';

type ChipProps = {
  label: string;
  icon?: AppIconName;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  /**
   * `filter` (default): a primary-tinted choice pill; pressable chips are 44pt tall. `tag`: a neutral, read-only
   * label (amenities, categories) that is never focusable or pressable. Use `StatusBadge` for statuses.
   */
  variant?: 'filter' | 'tag';
  /** One-of-many choice inside a `radiogroup`: announced as a radio with `aria-checked` instead of a toggle. */
  radio?: boolean;
  disabled?: boolean;
  /** Number of items behind this filter, shown as a small pill after the label ("Career 2"). */
  count?: number;
};

const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

/** Filter and choice pill (44pt when pressable), or a neutral `tag`. Selection is exposed to assistive tech. */
export function Chip({
  label,
  icon,
  selected,
  onPress,
  accessibilityLabel,
  variant = 'filter',
  radio,
  disabled,
  count,
}: ChipProps) {
  const theme = useTheme();

  if (variant === 'tag') {
    return (
      <XStack
        aria-label={accessibilityLabel ?? label}
        alignItems="center"
        backgroundColor="$surfaceContainer"
        borderRadius="$pill"
        gap="$x1"
        minHeight={28}
        paddingHorizontal="$x3"
      >
        {icon ? <AppIcon color={theme.colorMuted?.get()} name={icon} size={14} /> : null}
        <AppText numberOfLines={1} tone="muted" variant="caption">
          {label}
        </AppText>
      </XStack>
    );
  }

  const pressable = Boolean(onPress);
  const interactive = pressable && !disabled;
  const foreground = selected ? theme.onPrimary?.get() : theme.colorMuted?.get();
  return (
    <XStack
      aria-label={accessibilityLabel ?? label}
      role={pressable ? (radio ? 'radio' : 'button') : undefined}
      aria-checked={pressable && radio ? Boolean(selected) : undefined}
      aria-pressed={pressable && !radio ? Boolean(selected) : undefined}
      aria-disabled={pressable && disabled ? true : undefined}
      alignItems="center"
      backgroundColor={selected ? '$primary' : '$surface'}
      borderColor={selected ? '$primary' : '$borderColor'}
      borderRadius="$pill"
      borderWidth={1}
      cursor={pressable ? (disabled ? 'not-allowed' : 'pointer') : undefined}
      focusVisibleStyle={interactive ? focusRing : undefined}
      focusable={interactive}
      gap="$x1"
      hoverStyle={interactive ? { borderColor: '$primary' } : undefined}
      minHeight={pressable ? '$touch' : 28}
      onPress={interactive ? onPress : undefined}
      {...keyboardPress(onPress, interactive)}
      opacity={disabled ? 0.5 : 1}
      paddingHorizontal={pressable ? '$x4' : '$x3'}
      pressStyle={interactive ? { opacity: 0.85 } : undefined}
    >
      {icon ? <AppIcon color={foreground} name={icon} size={pressable ? 16 : 14} /> : null}
      <AppText
        color={selected ? '$onPrimary' : '$color'}
        numberOfLines={1}
        variant={pressable ? 'label' : 'caption'}
      >
        {label}
      </AppText>
      {count !== undefined ? (
        <XStack
          alignItems="center"
          backgroundColor={selected ? '$onPrimary' : '$primarySoft'}
          borderRadius="$pill"
          justifyContent="center"
          minWidth={22}
          paddingHorizontal={6}
        >
          <AppText color="$primary" fontSize={12} fontWeight="800">
            {count}
          </AppText>
        </XStack>
      ) : null}
    </XStack>
  );
}
