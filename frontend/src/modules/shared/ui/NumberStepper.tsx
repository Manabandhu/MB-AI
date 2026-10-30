import { useId } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { canStep, stepValue } from '@/modules/shared/ui/fieldMath';
import { IconButton } from '@/modules/shared/ui/IconButton';

type NumberStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  helper?: string;
  error?: string | null;
  step?: number;
};

/** Whole-number input (seats, guests, quantity): 44pt − / + buttons that stop at the bounds, value announced. */
export function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
  helper,
  error,
  step = 1,
}: NumberStepperProps) {
  const id = useId();
  return (
    <YStack gap="$x1">
      <AppText id={`${id}-label`} variant="label">
        {label}
      </AppText>
      <XStack alignItems="center" aria-labelledby={`${id}-label`} gap="$x3" role="group">
        <IconButton
          disabled={!canStep(value, -1, min, max)}
          icon="minus"
          label={`Decrease ${label}`}
          onPress={() => onChange(stepValue(value, -1, min, max, step))}
        />
        <YStack alignItems="center" minWidth={48}>
          <AppText aria-label={`${label}: ${value}`} aria-live="polite" variant="h3">
            {value}
          </AppText>
        </YStack>
        <IconButton
          disabled={!canStep(value, 1, min, max)}
          icon="plus"
          label={`Increase ${label}`}
          onPress={() => onChange(stepValue(value, 1, min, max, step))}
        />
      </XStack>
      {error ? (
        <AppText aria-live="polite" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : helper ? (
        <AppText tone="muted" variant="caption">
          {helper}
        </AppText>
      ) : null}
    </YStack>
  );
}
