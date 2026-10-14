import { useMutation, useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  type AutomationOperation,
  executeAutomation,
  listAutomationOperations,
} from '@/modules/admin/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import {
  AppButton,
  AppText,
  Card,
  CheckboxRow,
  ResponsiveGrid,
  Screen,
  ScreenHeader,
  Section,
  SegmentedControl,
  SkeletonCard,
  StatusBadge,
  type StatusTone,
  TextField,
  useConfirm,
} from '@/modules/shared/ui';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';

type Environment = 'development' | 'staging' | 'production';

const ENVIRONMENTS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
] as const;

/** Mirrors `ExecuteAutomationRequest`: the server rejects anything else. */
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const MIN_REASON = 10;
const MAX_REASON = 500;

const riskTone: Record<AutomationOperation['risk'], StatusTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

function OperationOption({
  operation,
  selected,
  onSelect,
}: {
  operation: AutomationOperation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <YStack
      aria-checked={selected}
      aria-label={`${operation.label}, ${operation.risk} risk${operation.configured ? '' : ', needs configuration'}`}
      backgroundColor={selected ? '$primaryTint' : '$surface'}
      borderColor={selected ? '$primary' : '$borderColor'}
      borderRadius="$card"
      borderWidth={selected ? 2 : 1}
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      gap="$x1"
      minHeight="$touch"
      onPress={onSelect}
      {...keyboardPress(onSelect)}
      padding="$x3"
      role="radio"
    >
      <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
        <AppText flex={1} variant="bodyStrong">
          {operation.label}
        </AppText>
        <StatusBadge label={`${operation.risk} risk`} tone={riskTone[operation.risk]} />
      </XStack>
      <AppText tone="muted" variant="caption">
        {operation.description}
      </AppText>
      {operation.configured ? null : (
        <AppText tone="danger" variant="caption">
          Needs configuration on the backend before it can run.
        </AppText>
      )}
    </YStack>
  );
}

/**
 * Super-admin control plane: pick an allow-listed automation, an environment, a git ref, and a reason, then
 * dispatch. Risky operations need the confirmation box ticked; production always asks once more.
 */
export default function AdminAutomationsScreen() {
  const confirm = useConfirm();
  const operations = useQuery({
    queryKey: ['admin', 'automations'],
    queryFn: listAutomationOperations,
    retry: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<Environment>('staging');
  const [ref, setRef] = useState('main');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const selected = operations.data?.find((operation) => operation.id === selectedId);
  const execution = useMutation({
    mutationFn: (input: { id: string; environment: Environment; ref: string; reason: string }) =>
      executeAutomation(input.id, {
        environment: input.environment,
        ref: input.ref,
        reason: input.reason,
        confirmed,
      }),
  });

  const resetRequest = () => {
    setConfirmed(false);
    execution.reset();
  };

  const trimmedRef = ref.trim();
  const trimmedReason = reason.trim();
  const refProblem = REF_PATTERN.test(trimmedRef)
    ? null
    : 'Use a branch, tag, or commit (letters, digits, . _ / -).';
  const reasonProblem =
    trimmedReason.length < MIN_REASON ? `Explain why in at least ${MIN_REASON} characters.` : null;
  const needsConfirmation = Boolean(selected?.requiresConfirmation);
  const blocker = !selected
    ? 'Choose an automation first.'
    : !selected.configured
      ? 'This automation is not configured on the backend yet.'
      : refProblem
        ? refProblem
        : reasonProblem
          ? reasonProblem
          : needsConfirmation && !confirmed
            ? 'Tick the confirmation box to continue.'
            : null;

  const run = async () => {
    if (!selected || blocker) return;
    if (environment === 'production') {
      const ok = await confirm({
        title: `Run "${selected.label}" in production?`,
        body: `This dispatches against production from ${trimmedRef}. Production runs still wait for reviewer approval in GitHub, and the request is recorded in the audit log.`,
        confirmLabel: 'Run in production',
        destructive: true,
      });
      if (!ok) return;
    }
    execution.mutate({ id: selected.id, environment, ref: trimmedRef, reason: trimmedReason });
  };

  const header = (
    <ScreenHeader
      back={{ fallback: '/admin' as Href }}
      subtitle="Dispatch audited workflows. Infrastructure credentials stay on the backend and in CI."
      title="Automations"
    />
  );

  if (operations.isLoading) {
    return (
      <Screen>
        {header}
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </Screen>
    );
  }

  if (operations.isError) {
    return (
      <Screen>
        {header}
        <ErrorState
          body="The control plane needs the super admin role and a running backend."
          onRetry={() => void operations.refetch()}
          title="Automations unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <ResponsiveGrid columns={{ compact: 1, medium: 1, expanded: 2, wide: 2 }}>
        <Section title="Automation">
          <YStack aria-label="Automation" gap="$x2" role="radiogroup">
            {(operations.data ?? []).map((operation) => (
              <OperationOption
                key={operation.id}
                onSelect={() => {
                  setSelectedId(operation.id);
                  resetRequest();
                }}
                operation={operation}
                selected={selectedId === operation.id}
              />
            ))}
            {operations.data?.length === 0 ? (
              <AppText tone="muted">No automations are available.</AppText>
            ) : null}
          </YStack>
        </Section>

        <Section title="Request">
          <Card>
            <YStack gap="$x3">
              <AppText variant="label">Environment</AppText>
              <SegmentedControl
                label="Environment"
                onChange={(value) => {
                  setEnvironment(value);
                  resetRequest();
                }}
                options={ENVIRONMENTS}
                value={environment}
              />
              {environment === 'production' ? (
                <AppText role="note" tone="danger" variant="caption">
                  Production: you will be asked to confirm again before anything is dispatched.
                </AppText>
              ) : null}
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                error={trimmedRef && refProblem ? refProblem : null}
                label="Git ref"
                onChangeText={(value) => {
                  setRef(value);
                  execution.reset();
                }}
                value={ref}
              />
              <TextField
                helper={`Why this run is needed (${MIN_REASON}–${MAX_REASON} characters). Stored in the audit log.`}
                label="Reason"
                maxLength={MAX_REASON}
                multiline
                onChangeText={(value) => {
                  setReason(value);
                  execution.reset();
                }}
                placeholder="e.g. Redeploy staging after the config fix in #123"
                value={reason}
              />
              {needsConfirmation && selected ? (
                <CheckboxRow
                  checked={confirmed}
                  description={`Environment: ${environment}. Ref: ${trimmedRef || '—'}.`}
                  label={`I understand this ${selected.risk}-risk operation`}
                  onChange={setConfirmed}
                />
              ) : null}
              <AppButton
                disabled={Boolean(blocker) || execution.isPending}
                fullWidth
                icon="zap"
                label={execution.isPending ? 'Dispatching…' : 'Run automation'}
                loading={execution.isPending}
                onPress={() => void run()}
                variant={environment === 'production' ? 'danger' : 'primary'}
              />
              {blocker && !execution.isPending ? (
                <AppText tone="muted" variant="caption">
                  {blocker}
                </AppText>
              ) : null}
              {execution.isError ? (
                <AppText role="alert" tone="danger" variant="body">
                  {execution.error instanceof Error
                    ? execution.error.message
                    : 'The automation was not dispatched.'}
                </AppText>
              ) : null}
              {execution.data ? (
                <Card role="status" variant="tinted">
                  <AppText variant="bodyStrong">Accepted</AppText>
                  <AppText selectable variant="caption">
                    Execution {execution.data.executionId} · {execution.data.environment} ·{' '}
                    {execution.data.ref}
                  </AppText>
                </Card>
              ) : null}
            </YStack>
          </Card>
        </Section>
      </ResponsiveGrid>
    </Screen>
  );
}
