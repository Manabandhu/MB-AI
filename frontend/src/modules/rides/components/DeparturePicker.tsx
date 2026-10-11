import { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { ChoiceChip } from '@/modules/rides/components/ChoiceChip';
import { departureFrom } from '@/modules/rides/utils/rideFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';

export type DepartureValue = { dayOffset: number; hour: number; minute: number };

/** How many days ahead the date chips reach. */
const DAYS_AHEAD = 30;
const QUICK_TIMES: { hour: number; minute: number }[] = [
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 18, minute: 0 },
];

export function formatTime(hour: number, minute: number) {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dayLabel(offset: number, now: Date) {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  return departureFrom(offset, 0, 0, now).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function departureSummary(value: DepartureValue, now = new Date()) {
  const date = departureFrom(value.dayOffset, value.hour, value.minute, now);
  return `${date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at ${formatTime(value.hour, value.minute)}`;
}

/**
 * Date chips for the next month plus a time stepper. Pure React Native and Tamagui, so it behaves the same on
 * native and the web (the app does not ship a native date-picker dependency).
 */
export function DeparturePicker({
  value,
  onChange,
  dateLabel = 'Departure date',
  error,
}: {
  value: DepartureValue;
  onChange: (value: DepartureValue) => void;
  dateLabel?: string;
  error?: string | null;
}) {
  const now = new Date();
  const shiftMinutes = (delta: number) => {
    const total = (((value.hour * 60 + value.minute + delta) % 1440) + 1440) % 1440;
    onChange({ ...value, hour: Math.floor(total / 60), minute: total % 60 });
  };
  const timeText = formatTime(value.hour, value.minute);

  return (
    <YStack gap="$x3">
      <YStack gap="$x2">
        <AppText variant="label">{dateLabel}</AppText>
        <ScrollView
          accessibilityLabel={dateLabel}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          <XStack aria-label={dateLabel} gap="$x2" paddingVertical="$x1" role="radiogroup">
            {Array.from({ length: DAYS_AHEAD }, (_, offset) => (
              <ChoiceChip
                radio
                accessibilityLabel={`Depart ${dayLabel(offset, now)}`}
                key={offset}
                label={dayLabel(offset, now)}
                onPress={() => onChange({ ...value, dayOffset: offset })}
                selected={value.dayOffset === offset}
              />
            ))}
          </XStack>
        </ScrollView>
      </YStack>

      <YStack gap="$x2">
        <AppText variant="label">Departure time</AppText>
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          <AppButton label="−1 h" onPress={() => shiftMinutes(-60)} variant="secondary" />
          <AppButton label="−15 min" onPress={() => shiftMinutes(-15)} variant="secondary" />
          <YStack
            alignItems="center"
            aria-label={`Departure time ${timeText}`}
            aria-live="polite"
            minWidth={96}
            paddingHorizontal="$x2"
          >
            <AppText variant="h3">{timeText}</AppText>
          </YStack>
          <AppButton label="+15 min" onPress={() => shiftMinutes(15)} variant="secondary" />
          <AppButton label="+1 h" onPress={() => shiftMinutes(60)} variant="secondary" />
        </XStack>
        <XStack aria-label="Common departure times" flexWrap="wrap" gap="$x2" role="radiogroup">
          {QUICK_TIMES.map((t) => {
            const text = formatTime(t.hour, t.minute);
            return (
              <ChoiceChip
                radio
                accessibilityLabel={`Depart at ${text}`}
                key={text}
                label={text}
                onPress={() => onChange({ ...value, hour: t.hour, minute: t.minute })}
                selected={value.hour === t.hour && value.minute === t.minute}
              />
            );
          })}
        </XStack>
      </YStack>

      <AppText aria-live="polite" tone={error ? 'danger' : 'muted'} variant="caption">
        {error ?? `Departs ${departureSummary(value, now)}`}
      </AppText>
    </YStack>
  );
}
