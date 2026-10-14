import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { TextField } from '@/modules/shared/ui/TextField';

export type TextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  maxLength?: number;
  accessibilityLabel?: string;
};

/** Legacy multi-line field with a character counter, built on `TextField multiline`. */
export function TextArea({
  value,
  onChangeText,
  placeholder = 'Type here...',
  label,
  error,
  maxLength = 500,
  accessibilityLabel,
}: TextAreaProps) {
  return (
    <YStack gap="$x1">
      <TextField
        accessibilityLabel={accessibilityLabel}
        error={error}
        label={label}
        maxLength={maxLength}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
      />
      <AppText alignSelf="flex-end" tone="muted" variant="caption">
        {value.length}/{maxLength}
      </AppText>
    </YStack>
  );
}
