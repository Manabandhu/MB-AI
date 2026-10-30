import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

type CheckboxRowProps = {
  label: string;
  /** Second line under the label. */
  description?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  error?: string | null;
};

/**
 * A labelled checkbox: the whole row (at least 44pt tall) toggles, announced as a checkbox with `aria-checked`,
 * focusable and toggled with Space/Enter on web. Use it for confirmations and agreements without inline links.
 */
export function CheckboxRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  error,
}: CheckboxRowProps) {
  const { palette } = useAppearance();
  const toggle = () => onChange(!checked);
  return (
    <YStack gap="$x1">
      <XStack
        alignItems="center"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        aria-invalid={error ? true : undefined}
        aria-label={label}
        borderRadius="$control"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        focusVisibleStyle={{
          outlineWidth: 3,
          outlineStyle: 'solid',
          outlineColor: '$outlineColor',
        }}
        focusable={!disabled}
        gap="$x3"
        minHeight="$touch"
        onPress={disabled ? undefined : toggle}
        {...keyboardPress(toggle, !disabled)}
        opacity={disabled ? 0.5 : 1}
        paddingVertical="$x1"
        role="checkbox"
      >
        <YStack
          alignItems="center"
          backgroundColor={checked ? '$primary' : 'transparent'}
          borderColor={error ? '$error' : checked ? '$primary' : '$borderColor'}
          borderRadius={6}
          borderWidth={2}
          height={24}
          justifyContent="center"
          width={24}
        >
          {checked ? <AppIcon color={palette.surface} name="check" size={16} /> : null}
        </YStack>
        <YStack flex={1} gap={2}>
          <AppText variant="body">{label}</AppText>
          {description ? (
            <AppText tone="muted" variant="caption">
              {description}
            </AppText>
          ) : null}
        </YStack>
      </XStack>
      {error ? (
        <AppText role="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </YStack>
  );
}
