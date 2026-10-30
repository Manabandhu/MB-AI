import { departureFrom } from '@/modules/rides/utils/rideFormat';
import { DateTimeField, formatTimeOfDay } from '@/modules/shared/ui/DateTimeField';
import { addDays, dayDifference, startOfDay } from '@/modules/shared/ui/fieldMath';

export type DepartureValue = { dayOffset: number; hour: number; minute: number };

/** How many days ahead a departure may be chosen. */
const DAYS_AHEAD = 30;

export function formatTime(hour: number, minute: number) {
  return formatTimeOfDay(hour, minute);
}

export function departureSummary(value: DepartureValue, now = new Date()) {
  const date = departureFrom(value.dayOffset, value.hour, value.minute, now);
  return `${date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at ${formatTime(value.hour, value.minute)}`;
}

/**
 * Rides' departure input: the shared `DateTimeField` in `datetime` mode, limited to today through the next
 * month, translated to and from the `{ dayOffset, hour, minute }` value the ride forms keep.
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
  const today = startOfDay(now);
  return (
    <DateTimeField
      error={error}
      helper={`Departs ${departureSummary(value, now)}`}
      label={dateLabel}
      maximumDate={addDays(today, DAYS_AHEAD - 1)}
      minimumDate={today}
      mode="datetime"
      onChange={(date) =>
        onChange({
          dayOffset: dayDifference(today, date),
          hour: date.getHours(),
          minute: date.getMinutes(),
        })
      }
      timeLabel="Departure time"
      value={departureFrom(value.dayOffset, value.hour, value.minute, now)}
    />
  );
}
