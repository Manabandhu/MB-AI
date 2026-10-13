import { XStack, YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';
import { AppButton } from './AppButton';
import { AppText, Heading } from './AppText';
import { DiscoveryArtwork, type DiscoveryKind } from './DiscoveryArtwork';
import { GradientSurface } from './GradientSurface';

/** High-contrast editorial feature, sized by window class rather than device model. */
export function EditorialBanner({
  eyebrow,
  title,
  body,
  kind,
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
  const { windowClass, fontScale } = useAdaptiveLayout();
  const { palette } = useAppearance();
  const compact = windowClass === 'compact';
  const small = density === 'compact';
  return (
    <GradientSurface
      colors={[palette.editorialSurface, palette.editorialSurface, palette.editorialBorder]}
      padding={small ? 20 : compact ? 24 : 32}
      radius={28}
    >
      <YStack gap={small ? '$x3' : '$x5'}>
        <AppText color="$editorialAccent" variant="overline" letterSpacing={2}>
          {eyebrow}
        </AppText>
        <XStack alignItems="center" gap="$x2">
          <YStack flex={1} minWidth={0} gap="$x3">
            <Heading
              color="$editorialInk"
              variant="display"
              fontSize={small ? 26 : compact || fontScale > 1.2 ? 32 : 46}
              lineHeight={small ? 30 : compact || fontScale > 1.2 ? 36 : 50}
              letterSpacing={-1.2}
            >
              {title}
            </Heading>
            {body ? (
              <AppText color="$editorialMuted" variant="caption" maxWidth={360}>
                {body}
              </AppText>
            ) : null}
          </YStack>
          {fontScale <= 1.2 ? (
            <YStack width={small ? 84 : compact ? 96 : 220} flexShrink={0} aria-hidden>
              <DiscoveryArtwork kind={kind} height={small ? 80 : compact ? 116 : 180} />
            </YStack>
          ) : null}
        </XStack>
        {action ? (
          <YStack alignSelf="flex-start" maxWidth="100%">
            <AppButton
              label={action.label}
              iconAfter="arrow-right"
              route={action.route}
              variant="editorial"
              size="sm"
              fullWidth
            />
          </YStack>
        ) : null}
      </YStack>
    </GradientSurface>
  );
}
