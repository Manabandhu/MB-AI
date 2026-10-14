import { Image } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';

type ChatBubbleProps = {
  body: string;
  time: string;
  mine: boolean;
  /** `sending` while the request is in flight; `failed` shows a retry instead of a time. */
  status?: 'sent' | 'sending' | 'failed';
  /** Renders `body` as a picture (an http(s) URL). */
  image?: boolean;
  onRetry?: () => void;
  onDiscard?: () => void;
  /** Sender label shown above other people's messages in group chats. */
  sender?: string;
};

/** One message: mine on the right in the primary colour, others on the left on the surface colour. */
export function ChatBubble({
  body,
  time,
  mine,
  status = 'sent',
  image = false,
  onRetry,
  onDiscard,
  sender,
}: ChatBubbleProps) {
  const failed = status === 'failed';
  return (
    <YStack alignSelf={mine ? 'flex-end' : 'flex-start'} gap="$x1" maxWidth="82%">
      {sender && !mine ? (
        <AppText tone="muted" variant="caption">
          {sender}
        </AppText>
      ) : null}
      <YStack
        backgroundColor={mine ? (failed ? '$errorBg' : '$primary') : '$surface'}
        borderColor={mine ? (failed ? '$error' : '$primary') : '$borderColor'}
        borderRadius="$card"
        borderWidth={1}
        gap="$x1"
        opacity={status === 'sending' ? 0.7 : 1}
        padding={image ? '$x1' : '$x3'}
      >
        {image ? (
          <Image
            accessibilityLabel="Shared photo"
            resizeMode="cover"
            source={{ uri: body }}
            style={{ width: 220, height: 160, borderRadius: 12 }}
          />
        ) : (
          <AppText selectable tone={mine && !failed ? 'onPrimary' : 'default'} variant="body">
            {body}
          </AppText>
        )}
        <AppText
          alignSelf="flex-end"
          tone={mine && !failed ? 'onPrimary' : failed ? 'danger' : 'muted'}
          variant="caption"
        >
          {failed ? 'Not sent' : status === 'sending' ? 'Sending…' : time}
        </AppText>
      </YStack>
      {failed && (onRetry || onDiscard) ? (
        <XStack alignSelf="flex-end" gap="$x2">
          {onDiscard ? (
            <AppButton label="Discard" onPress={onDiscard} size="sm" variant="ghost" />
          ) : null}
          {onRetry ? (
            <AppButton
              icon="refresh"
              label="Retry"
              onPress={onRetry}
              size="sm"
              variant="secondary"
            />
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  );
}
