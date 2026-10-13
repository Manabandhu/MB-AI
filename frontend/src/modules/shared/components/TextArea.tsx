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
export function TextArea({
  value,
  onChangeText,
  placeholder = 'Type here…',
  label,
  error,
  maxLength = 500,
  accessibilityLabel,
}: TextAreaProps) {
  return (
    <YStack gap="$x2">
      <TextField
        multiline
        label={label}
        aria-label={accessibilityLabel ?? label ?? placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        maxLength={maxLength}
      />
      <AppText tone="muted" variant="caption" textAlign="right">
        {value.length} / {maxLength}
      </AppText>
    </YStack>
  );
}
