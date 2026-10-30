import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';

export type MessageBubbleProps = {
  body: string;
  time: string;
  sent: boolean;
};

/** Chat bubble: sent messages on `$primary`, received on the surface with a border. */
export function MessageBubble({ body, time, sent }: MessageBubbleProps) {
  return (
    <YStack
      alignSelf={sent ? 'flex-end' : 'flex-start'}
      backgroundColor={sent ? '$primary' : '$surface'}
      borderColor={sent ? 'transparent' : '$borderColor'}
      borderRadius="$card"
      borderWidth={1}
      gap="$x1"
      maxWidth="80%"
      padding="$x3"
    >
      <AppText tone={sent ? 'onPrimary' : 'default'}>{body}</AppText>
      <AppText opacity={sent ? 0.85 : 1} tone={sent ? 'onPrimary' : 'muted'} variant="caption">
        {time}
      </AppText>
    </YStack>
  );
}
