import type { Href } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import type { Community } from '@/modules/community/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';

type CommunityRowProps = {
  community: Community;
  onToggle: () => void;
  pending: boolean;
};

/** A community in a list: opens the community; the join/leave button sits beside it. */
export function CommunityRow({ community, onToggle, pending }: CommunityRowProps) {
  const members = `${community.memberCount.toLocaleString()} ${community.memberCount === 1 ? 'member' : 'members'}`;
  return (
    <Card padding="$x3">
      <XStack alignItems="center" gap="$x3">
        <Card
          aria-label={community.name}
          borderWidth={0}
          flex={1}
          href={`/community/${community.id}` as Href}
          minWidth={0}
          padding={0}
        >
          <YStack gap={2}>
            <Heading numberOfLines={1} variant="h4">
              {community.name}
            </Heading>
            {community.description ? (
              <AppText numberOfLines={2} tone="muted" variant="caption">
                {community.description}
              </AppText>
            ) : null}
            <AppText tone="primary" variant="caption">
              {[community.metroArea, members].filter(Boolean).join(' · ')}
            </AppText>
          </YStack>
        </Card>
        <AppButton
          disabled={pending}
          label={community.isJoined ? 'Leave' : 'Join'}
          loading={pending}
          onPress={onToggle}
          size="sm"
          variant={community.isJoined ? 'ghost' : 'secondary'}
        />
      </XStack>
    </Card>
  );
}
