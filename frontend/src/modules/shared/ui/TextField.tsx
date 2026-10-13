import { forwardRef, type ReactNode, useId } from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { Input, TextArea, useTheme, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';

type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string | null;
  /** Decorative icon inside the field's leading edge (single-line fields only). */
  leadingIcon?: AppIconName;
  /** A 44pt control inside the trailing edge, such as a clear `IconButton` (single-line fields only). */
  trailing?: ReactNode;
};

/** Room reserved for `leadingIcon` (icon + gap) and `trailing` (a 44pt control + 4pt inset). */
const LEADING_SPACE = 44;
const TRAILING_SPACE = 52;

/**
 * Labelled text input with helper and error text wired for screen readers. `multiline` renders Tamagui's `TextArea`:
 * on web its `Input` ignores `multiline` and would draw a single-line `<input>` that cannot wrap or hold newlines.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, helper, error, multiline, leadingIcon, trailing, ...props },
  ref,
) {
  const id = useId();
  const theme = useTheme();
  const Field = multiline ? TextArea : Input;
  const leading = !multiline && leadingIcon;
  const trailingControl = !multiline && trailing;
  const field = (
    <Field
      ref={ref as never}
      aria-label={label ?? props.placeholder}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={error || helper ? `${id}-description` : undefined}
      aria-invalid={Boolean(error)}
      backgroundColor="$surface"
      borderColor={error ? '$error' : '$borderColor'}
      borderRadius="$control"
      borderWidth={1}
      color="$color"
      focusStyle={{
        borderColor: '$primary',
        outlineColor: '$outlineColor',
        outlineWidth: 2,
        outlineStyle: 'solid',
      }}
      fontSize={16}
      minHeight={multiline ? 112 : '$control'}
      multiline={multiline}
      paddingHorizontal="$x4"
      paddingLeft={leading ? LEADING_SPACE : undefined}
      paddingRight={trailingControl ? TRAILING_SPACE : undefined}
      paddingVertical={multiline ? '$x3' : undefined}
      placeholderTextColor="$placeholderColor"
      textAlignVertical={multiline ? 'top' : 'center'}
      {...(props as object)}
    />
  );
  return (
    <YStack gap="$x1" width="100%">
      {label ? (
        <AppText id={`${id}-label`} variant="label">
          {label}
        </AppText>
      ) : null}
      {leading || trailingControl ? (
        <YStack justifyContent="center" position="relative">
          {field}
          {leading ? (
            <YStack aria-hidden left="$x4" pointerEvents="none" position="absolute">
              <AppIcon color={theme.colorMuted?.val} name={leading} size={18} />
            </YStack>
          ) : null}
          {trailingControl ? (
            <YStack position="absolute" right={4}>
              {trailing}
            </YStack>
          ) : null}
        </YStack>
      ) : (
        field
      )}
      {error ? (
        <AppText id={`${id}-description`} aria-live="polite" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : helper ? (
        <AppText id={`${id}-description`} tone="muted" variant="caption">
          {helper}
        </AppText>
      ) : null}
    </YStack>
  );
});
