import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { createReport, type ReportSeverity } from '@/modules/safety/api';
import {
  MIN_REPORT_DESCRIPTION,
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
  reportCategory,
} from '@/modules/safety/utils/safetyFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { showMessage } from '@/modules/shared/ui/notify';
import { TextField } from '@/modules/shared/ui/TextField';

const SEVERITIES: { value: ReportSeverity; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Urgent' },
];

type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Id (UUID) of the member, conversation, or listing being reported. */
  targetId: string | null;
  targetType: ReportTargetType;
  /** What the person sees as the subject, e.g. "Member 3F2A" or "this conversation". */
  targetLabel: string;
};

/**
 * Files a real safety report (`POST /api/v1/safety/reports`). The sheet only closes and confirms after the server
 * stored the report; a failure stays in the sheet with the message so nothing is lost.
 */
export function ReportSheet({
  visible,
  onClose,
  targetId,
  targetType,
  targetLabel,
}: ReportSheetProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [severity, setSeverity] = useState<ReportSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      createReport({
        targetId: targetId ?? '',
        category: reportCategory(targetType, reason ?? 'other'),
        description: description.trim(),
        severity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety'] });
      onClose();
      showMessage(
        'Report sent',
        'Thank you. You can follow its status under Safety → Reports. If you are in danger, call 911.',
      );
    },
  });

  // Each opening starts clean, including the previous attempt's error.
  const { reset } = submit;
  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setSeverity('MEDIUM');
    setDescription('');
    setTouched(false);
    reset();
  }, [visible, reset]);

  const reasonError = touched && !reason ? 'Choose what happened.' : null;
  const descriptionError =
    touched && description.trim().length < MIN_REPORT_DESCRIPTION
      ? `Describe what happened (at least ${MIN_REPORT_DESCRIPTION} characters).`
      : null;

  const onSubmit = () => {
    setTouched(true);
    if (!targetId || !reason || description.trim().length < MIN_REPORT_DESCRIPTION) return;
    submit.mutate();
  };

  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      subtitle={`Reporting ${targetLabel}`}
      title="File a report"
      visible={visible}
    >
      <YStack gap="$x4">
        <YStack gap="$x2">
          <AppText variant="label">What happened?</AppText>
          <FilterChipRow label="Reason" role="radiogroup">
            {REPORT_REASONS.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                onPress={() => setReason(r.value)}
                radio
                selected={reason === r.value}
              />
            ))}
          </FilterChipRow>
          {reasonError ? (
            <AppText role="alert" tone="danger" variant="caption">
              {reasonError}
            </AppText>
          ) : null}
        </YStack>
        <YStack gap="$x2">
          <AppText variant="label">How serious is it?</AppText>
          <FilterChipRow label="Severity" role="radiogroup">
            {SEVERITIES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                onPress={() => setSeverity(s.value)}
                radio
                selected={severity === s.value}
              />
            ))}
          </FilterChipRow>
        </YStack>
        <TextField
          error={descriptionError}
          helper="Include dates, what was said, and anything else that helps the safety team."
          label="Details"
          maxLength={4000}
          multiline
          onChangeText={setDescription}
          value={description}
        />
        {submit.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            {submit.error instanceof Error ? submit.error.message : 'Could not send the report.'}{' '}
            Please try again.
          </AppText>
        ) : null}
        <AppButton
          disabled={!targetId}
          fullWidth
          label="Send report"
          loading={submit.isPending}
          onPress={onSubmit}
          size="lg"
        />
      </YStack>
    </BottomSheet>
  );
}
