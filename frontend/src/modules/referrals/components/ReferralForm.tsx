import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import type { Referral } from '@/modules/referrals/api';
import { REFERRALS_KEY } from '@/modules/referrals/utils/referralStatus';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

type ReferralFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  /** Returns an error message per field, or an empty object when valid. */
  validate: () => Record<string, string>;
  onErrors: (errors: Record<string, string>) => void;
  submit: () => Promise<Referral>;
  children: ReactNode;
};

/** Shared frame for the offer and request forms: validates, posts, then opens the new referral. */
export function ReferralForm({
  title,
  subtitle,
  submitLabel,
  validate,
  onErrors,
  submit,
  children,
}: ReferralFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: async (referral) => {
      await queryClient.invalidateQueries({ queryKey: REFERRALS_KEY });
      router.replace(`/referrals/${referral.id}` as Href);
    },
    onError: (error) => setSubmitError(errorText(error, 'Your referral was not posted.')),
  });

  const onSubmit = () => {
    const errors = validate();
    onErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitError(null);
    mutation.mutate();
  };

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: '/referrals' as Href }} subtitle={subtitle} title={title} />
        <Card gap="$x3">{children}</Card>
        {submitError ? (
          <AppText role="alert" tone="danger">
            {submitError}
          </AppText>
        ) : null}
        <XStack gap="$x3" justifyContent="flex-end">
          <AppButton
            label="Cancel"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/referrals' as Href)
            }
            variant="ghost"
          />
          <AppButton
            disabled={mutation.isPending}
            label={submitLabel}
            loading={mutation.isPending}
            onPress={onSubmit}
          />
        </XStack>
      </YStack>
    </Screen>
  );
}
