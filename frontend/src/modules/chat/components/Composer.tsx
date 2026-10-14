import { XStack } from 'tamagui';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { TextField } from '@/modules/shared/ui/TextField';

type ComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Accessible name for the input. */
  label: string;
  placeholder?: string;
  sendLabel?: string;
  /** Blocks sending (for example while a request is in flight). */
  busy?: boolean;
  maxLength?: number;
};

/** Message input with a send button; Enter sends on hardware keyboards (web) and the return key sends on phones. */
export function Composer({
  value,
  onChangeText,
  onSend,
  label,
  placeholder = 'Type a message…',
  sendLabel = 'Send message',
  busy = false,
  maxLength = 4000,
}: ComposerProps) {
  const canSend = value.trim().length > 0 && !busy;
  return (
    <XStack alignItems="center" gap="$x2">
      <XStack flex={1}>
        <TextField
          aria-label={label}
          maxLength={maxLength}
          onChangeText={onChangeText}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          placeholder={placeholder}
          returnKeyType="send"
          submitBehavior="submit"
          value={value}
        />
      </XStack>
      <IconButton
        disabled={!canSend}
        icon="arrow-right"
        label={sendLabel}
        onPress={onSend}
        variant="solid"
      />
    </XStack>
  );
}
