import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Chip } from '@/modules/shared/ui/Chip';
import { TextField } from '@/modules/shared/ui/TextField';
import { reportListing } from '../api';
import { DESCRIPTION_MAX, errorMessage, REPORT_REASONS } from '../utils/listingRules';

/** Reason chips plus optional details. Success is shown only after the backend accepted the report. */
export function ReportListingSheet({
  listingId,
  visible,
  onClose,
}: {
  listingId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      reportListing(listingId, {
        reason: reason ?? '',
        description: description.trim() || undefined,
      }),
    onSuccess: () =>
      setResult({ ok: true, message: 'Report sent. A moderator will review this listing.' }),
    onError: (error: unknown) => {
      const status = (error as { status?: number } | null)?.status;
      setResult({
        ok: false,
        message:
          status === 409
            ? 'You already reported this listing. A moderator is reviewing it.'
            : errorMessage(error, 'Could not send the report.'),
      });
    },
  });

  const close = () => {
    onClose();
    if (result?.ok) {
      setReason(null);
      setDescription('');
    }
    setResult(null);
  };

  return (
    <BottomSheet
      onClose={close}
      subtitle="Tell us what is wrong. The seller is not told who reported it."
      title="Report listing"
      visible={visible}
    >
      <YStack gap="$x3" paddingBottom="$x2">
        {result?.ok ? (
          <>
            <AppText aria-live="polite" tone="success" variant="label">
              {result.message}
            </AppText>
            <AppButton fullWidth label="Done" onPress={close} />
          </>
        ) : (
          <>
            <XStack aria-label="Reason" flexWrap="wrap" gap="$x2" role="radiogroup">
              {REPORT_REASONS.map((r) => (
                <Chip key={r} label={r} onPress={() => setReason(r)} selected={reason === r} />
              ))}
            </XStack>
            <TextField
              label="Details (optional)"
              maxLength={DESCRIPTION_MAX}
              multiline
              onChangeText={setDescription}
              placeholder="What should a moderator know?"
              value={description}
            />
            {result && !result.ok ? (
              <AppText aria-live="polite" tone="danger" variant="caption">
                {result.message}
              </AppText>
            ) : null}
            <AppButton
              disabled={!reason}
              fullWidth
              label="Send report"
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
              variant="danger"
            />
          </>
        )}
      </YStack>
    </BottomSheet>
  );
}
