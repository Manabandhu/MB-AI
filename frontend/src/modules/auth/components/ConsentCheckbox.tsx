import { type Href, router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

type Props = { checked: boolean; onChange: (next: boolean) => void; error?: string | null };

/** Required agreement to the Terms of Service and Privacy Policy, with both documents one tap away. */
export function ConsentCheckbox({ checked, onChange, error }: Props) {
  const { palette } = useAppearance();
  return (
    <YStack gap="$x1">
      <XStack alignItems="flex-start" gap="$x3">
        <YStack
          alignItems="center"
          aria-checked={checked}
          aria-label="I agree to the Terms of Service and Privacy Policy"
          backgroundColor={checked ? '$primary' : 'transparent'}
          borderColor={error ? '$error' : checked ? '$primary' : '$borderColor'}
          borderRadius={6}
          borderWidth={2}
          cursor="pointer"
          height={24}
          hitSlop={10}
          justifyContent="center"
          marginTop={2}
          onPress={() => onChange(!checked)}
          role="checkbox"
          width={24}
        >
          {checked ? <AppIcon color={palette.surface} name="check" size={16} /> : null}
        </YStack>
        <AppText flex={1} variant="caption">
          I agree to the{' '}
          <AppText
            color="$primary"
            onPress={() => router.push('/terms' as Href)}
            role="link"
            textDecorationLine="underline"
            variant="caption"
          >
            Terms of Service
          </AppText>{' '}
          and{' '}
          <AppText
            color="$primary"
            onPress={() => router.push('/privacy' as Href)}
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
