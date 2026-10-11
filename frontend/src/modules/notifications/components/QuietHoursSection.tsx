import { useEffect, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { TextField } from '@/modules/shared/ui/TextField';
import { SettingRow } from './SettingRow';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

type Props = {
  enabled: boolean;
  start: string;
  end: string;
  timeZone: string;
  saving: boolean;
  onToggle: (next: boolean) => void;
  onSaveTimes: (start: string, end: string) => void;
};

/** Quiet hours hold pushes (not the inbox) between two times in the member's own time zone. */
export function QuietHoursSection({
  enabled,
  start,
  end,
  timeZone,
  saving,
  onToggle,
  onSaveTimes,
}: Props) {
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);
  useEffect(() => {
    setFrom(start);
    setTo(end);
  }, [start, end]);
  const fromError = HH_MM.test(from) ? null : 'Use 24-hour time, for example 22:00';
  const toError = HH_MM.test(to) ? null : 'Use 24-hour time, for example 07:00';
  const changed = from !== start || to !== end;

  return (
    <Card padding="$x4">
      <YStack gap="$x3">
        <SettingRow
          description={`Pushes wait until quiet hours end. Times use ${timeZone}.`}
          icon="moon"
          onChange={onToggle}
          title="Quiet hours"
          value={enabled}
        />
        {enabled ? (
          <YStack gap="$x3">
            <XStack gap="$x3">
              <YStack flex={1}>
                <TextField
                  error={fromError}
                  label="From"
                  maxLength={5}
                  onChangeText={setFrom}
                  value={from}
                />
              </YStack>
              <YStack flex={1}>
                <TextField
                  error={toError}
                  label="Until"
                  maxLength={5}
                  onChangeText={setTo}
                  value={to}
                />
              </YStack>
            </XStack>
            {changed ? (
              <AppButton
                disabled={Boolean(fromError || toError)}
                label="Save quiet hours"
                loading={saving}
                onPress={() => onSaveTimes(from, to)}
                size="sm"
              />
            ) : (
              <AppText tone="muted" variant="caption">
                Pushes pause from {start} until {end}.
              </AppText>
            )}
          </YStack>
        ) : null}
      </YStack>
    </Card>
  );
}
