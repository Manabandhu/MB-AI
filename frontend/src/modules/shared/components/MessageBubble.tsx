import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';

export type MessageBubbleProps = { body: string; time: string; sent: boolean };
export function MessageBubble({ body, time, sent }: MessageBubbleProps) {
  return (
    <YStack
      alignSelf={sent ? 'flex-end' : 'flex-start'}
      backgroundColor={sent ? '$primary' : '$surface'}
      borderRadius="$card"
      maxWidth="85%"
      padding="$x4"
      gap="$x2"
    >
      <AppText color={sent ? '$onPrimary' : '$color'}>{body}</AppText>
      <AppText color={sent ? '$onPrimary' : '$colorMuted'} variant="caption" textAlign="right">
        {time}
      </AppText>
    </YStack>
  );
}
