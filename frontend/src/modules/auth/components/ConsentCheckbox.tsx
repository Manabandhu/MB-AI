import { type Href, router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

type Props = { checked: boolean; onChange: (next: boolean) => void; error?: string | null };

const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

/**
 * Required agreement to the Terms of Service and Privacy Policy, with both documents one tap away. The whole 44pt
 * box is the checkbox (role, `aria-checked`, Space/Enter on web); the two document links are separate controls.
 */
export function ConsentCheckbox({ checked, onChange, error }: Props) {
  const { palette } = useAppearance();
  const toggle = () => onChange(!checked);
  const openTerms = () => router.push('/terms' as Href);
  const openPrivacy = () => router.push('/privacy' as Href);
  return (
    <YStack gap="$x1">
      <XStack alignItems="flex-start" gap="$x2">
        <YStack
          alignItems="center"
          aria-checked={checked}
          aria-invalid={error ? true : undefined}
          aria-label="I agree to the Terms of Service and Privacy Policy"
          borderRadius="$control"
          cursor="pointer"
          focusVisibleStyle={focusRing}
          focusable
          height="$touch"
          justifyContent="center"
          marginLeft={-10}
          marginTop={-10}
          onPress={toggle}
          {...keyboardPress(toggle)}
          role="checkbox"
          width="$touch"
        >
          <YStack
            alignItems="center"
            backgroundColor={checked ? '$primary' : 'transparent'}
            borderColor={error ? '$error' : checked ? '$primary' : '$borderColor'}
            borderRadius={6}
            borderWidth={2}
            height={24}
            justifyContent="center"
            width={24}
          >
            {checked ? <AppIcon color={palette.surface} name="check" size={16} /> : null}
          </YStack>
        </YStack>
        <AppText flex={1} variant="caption">
          I agree to the{' '}
          <AppText
            color="$primary"
            cursor="pointer"
            focusVisibleStyle={focusRing}
            onPress={openTerms}
            {...keyboardPress(openTerms, true, 'link')}
            role="link"
            textDecorationLine="underline"
            variant="caption"
          >
            Terms of Service
          </AppText>{' '}
          and{' '}
          <AppText
            color="$primary"
            cursor="pointer"
            focusVisibleStyle={focusRing}
            onPress={openPrivacy}
            {...keyboardPress(openPrivacy, true, 'link')}
            role="link"
            textDecorationLine="underline"
            variant="caption"
          >
            Privacy Policy
          </AppText>
          , and to use ManaBandhu respectfully.
        </AppText>
      </XStack>
      {error ? (
        <AppText role="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </YStack>
  );
}
