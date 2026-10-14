import { YStack } from 'tamagui';
import { AppButton } from './AppButton';
import { AppText, Heading } from './AppText';
import type { DiscoveryKind } from './DiscoveryArtwork';

/** A quiet section introduction; decoration never competes with the screen's task. */
export function EditorialBanner({
  eyebrow,
  title,
  body,
  action,
  density = 'feature',
}: {
  eyebrow: string;
  title: string;
  body?: string;
  kind: DiscoveryKind;
  density?: 'feature' | 'compact';
  action?: { label: string; route: string };
}) {
  const compact = density === 'compact';
  return (
    <YStack
      gap="$x3"
      paddingVertical={compact ? '$x2' : '$x5'}
      borderBottomWidth={1}
      borderColor="$borderColor"
    >
      <AppText tone="muted" variant="overline">
        {eyebrow}
      </AppText>
      <Heading variant={compact ? 'h3' : 'h1'}>{title}</Heading>
      {body ? (
        <AppText tone="muted" variant="body" maxWidth={560}>
          {body}
        </AppText>
      ) : null}
      {action ? (
        <YStack alignSelf="flex-start" maxWidth="100%">
          <AppButton
            label={action.label}
            iconAfter="arrow-right"
            route={action.route}
            variant="secondary"
            size="sm"
            fullWidth
          />
        </YStack>
      ) : null}
    </YStack>
  );
}
