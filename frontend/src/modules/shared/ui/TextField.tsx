import { forwardRef, useId } from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { Input, TextArea, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';

type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string | null;
};

/**
 * Labelled text input with helper and error text wired for screen readers. `multiline` renders Tamagui's `TextArea`:
 * on web its `Input` ignores `multiline` and would draw a single-line `<input>` that cannot wrap or hold newlines.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, helper, error, multiline, ...props },
  ref,
) {
  const id = useId();
  const Field = multiline ? TextArea : Input;
  return (
    <YStack gap="$x1" width="100%">
      {label ? (
        <AppText id={`${id}-label`} variant="label">
          {label}
        </AppText>
      ) : null}
      <Field
        ref={ref as never}
        aria-label={label ?? props.placeholder}
        aria-labelledby={label ? `${id}-label` : undefined}
        backgroundColor="$surfaceContainerLow"
        borderColor={error ? '$error' : '$borderColor'}
        borderRadius="$control"
        borderWidth={1}
        color="$color"
        focusStyle={{ borderColor: '$primary', borderWidth: 2 }}
        fontSize={16}
        minHeight={multiline ? 112 : '$control'}
        multiline={multiline}
        paddingHorizontal="$x4"
        paddingVertical={multiline ? '$x3' : undefined}
        placeholderTextColor="$placeholderColor"
        textAlignVertical={multiline ? 'top' : 'center'}
        {...(props as object)}
      />
      {error ? (
        <AppText aria-live="polite" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : helper ? (
        <AppText tone="muted" variant="caption">
          {helper}
        </AppText>
      ) : null}
    </YStack>
  );
});
