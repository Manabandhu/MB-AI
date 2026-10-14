import { radius } from '@manabandhu/design-system';
import { useId, useState } from 'react';
import { Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import {
  addDays,
  fromInputValue,
  monthGrid,
  sameDay,
  shiftTimeOfDay,
  startOfDay,
  toInputValue,
  withDay,
} from '@/modules/shared/ui/fieldMath';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

/** Day chips shown inline before "Pick a date…". */
const QUICK_DAYS = 7;
const TIME_STEP_MINUTES = 15;
const DEFAULT_HOUR = 9;
const QUICK_TIMES = [
  [7, 0],
  [8, 0],
  [9, 0],
  [12, 0],
  [17, 0],
  [18, 0],
] as const;
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function formatTimeOfDay(hour: number, minute: number) {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dayChipLabel(day: Date, today: Date) {
  if (sameDay(day, today)) return 'Today';
  if (sameDay(day, addDays(today, 1))) return 'Tomorrow';
  return day.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
}

function longDate(day: Date) {
  return day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

type DateTimeFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  mode: 'date' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string | null;
  helper?: string;
  /** Label above the time controls in `datetime` mode. */
  timeLabel?: string;
};

/**
 * Date (and time) input without a native picker dependency. Native: chips for the next seven days, "Pick a
 * date…" opening a month grid in a sheet, and in `datetime` mode a ±15 min stepper with quick times. Web: the
 * browser's `<input type="date">` / `datetime-local`, styled with theme tokens.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  mode,
  minimumDate,
  maximumDate,
  error,
  helper,
  timeLabel = 'Time',
}: DateTimeFieldProps) {
  const { palette, scheme } = useAppearance();
  const id = useId();
  const today = startOfDay(new Date());
  const minDay = minimumDate ? startOfDay(minimumDate) : null;
  const maxDay = maximumDate ? startOfDay(maximumDate) : null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const anchor = value ?? minDay ?? today;
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const footer = error ? (
    <AppText aria-live="polite" tone="danger" variant="caption">
      {error}
    </AppText>
  ) : helper ? (
    <AppText aria-live="polite" tone="muted" variant="caption">
      {helper}
    </AppText>
  ) : null;

  if (Platform.OS === 'web') {
    return (
      <YStack gap="$x1" width="100%">
        <AppText id={`${id}-label`} variant="label">
          {label}
        </AppText>
        <input
          aria-invalid={Boolean(error)}
          aria-label={label}
          max={maximumDate ? toInputValue(maximumDate, mode) : undefined}
          min={minimumDate ? toInputValue(minimumDate, mode) : undefined}
          onChange={(event) => {
            const next = fromInputValue(
              (event.currentTarget as unknown as { value: string }).value,
            );
            if (next) onChange(next);
          }}
          style={{
            backgroundColor: palette.surfaceContainerLow,
            border: `1px solid ${error ? palette.error : palette.border}`,
            borderRadius: radius.control,
            boxSizing: 'border-box',
            color: palette.ink,
            colorScheme: scheme,
            fontFamily: 'inherit',
            fontSize: 16,
            minHeight: 52,
            padding: '0 16px',
            width: '100%',
          }}
          type={mode === 'date' ? 'date' : 'datetime-local'}
          value={toInputValue(value, mode)}
        />
        {footer}
      </YStack>
    );
  }

  const outOfRange = (day: Date) => Boolean((minDay && day < minDay) || (maxDay && day > maxDay));
  const base =
    value ?? new Date(today.getFullYear(), today.getMonth(), today.getDate(), DEFAULT_HOUR);
  const pickDay = (day: Date) => onChange(mode === 'date' ? startOfDay(day) : withDay(day, base));

  const firstChip = minDay && minDay > today ? minDay : today;
  const chipDays = Array.from({ length: QUICK_DAYS }, (_, i) => addDays(firstChip, i)).filter(
    (day) => !outOfRange(day),
  );
  const valueOutsideChips = value && !chipDays.some((day) => sameDay(day, value));

  const firstMonth = minDay ? new Date(minDay.getFullYear(), minDay.getMonth(), 1) : null;
  const lastMonth = maxDay ? new Date(maxDay.getFullYear(), maxDay.getMonth(), 1) : null;
  const shiftMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <YStack gap="$x3" width="100%">
      <YStack gap="$x2">
        <AppText variant="label">{label}</AppText>
        <FilterChipRow label={label} role="radiogroup">
          {chipDays.map((day) => (
            <Chip
              accessibilityLabel={`${label}: ${longDate(day)}`}
              key={day.toDateString()}
              label={dayChipLabel(day, today)}
              onPress={() => pickDay(day)}
              radio
              selected={Boolean(value && sameDay(day, value))}
            />
          ))}
          {valueOutsideChips && value ? (
            <Chip
              accessibilityLabel={`${label}: ${longDate(value)}`}
              label={value.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              onPress={() => setPickerOpen(true)}
              radio
              selected
            />
          ) : null}
          <Chip
            accessibilityLabel={`${label}: pick a date from the calendar`}
            icon="calendar"
            label="Pick a date…"
            onPress={() => {
              const anchor = value ?? firstChip;
              setMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
              setPickerOpen(true);
            }}
          />
        </FilterChipRow>
      </YStack>

      {mode === 'datetime' ? (
        <YStack gap="$x2">
          <AppText variant="label">{timeLabel}</AppText>
          <XStack alignItems="center" gap="$x3">
            <IconButton
              icon="minus"
              label={`${TIME_STEP_MINUTES} minutes earlier`}
              onPress={() => onChange(shiftTimeOfDay(base, -TIME_STEP_MINUTES))}
            />
            <YStack alignItems="center" minWidth={96}>
              <AppText
                aria-label={`${timeLabel}: ${formatTimeOfDay(base.getHours(), base.getMinutes())}`}
                aria-live="polite"
                variant="h3"
              >
                {formatTimeOfDay(base.getHours(), base.getMinutes())}
              </AppText>
            </YStack>
            <IconButton
              icon="plus"
              label={`${TIME_STEP_MINUTES} minutes later`}
              onPress={() => onChange(shiftTimeOfDay(base, TIME_STEP_MINUTES))}
            />
          </XStack>
          <XStack
            aria-label={`Common ${timeLabel.toLowerCase()}s`}
            flexWrap="wrap"
            gap="$x2"
            role="radiogroup"
          >
            {QUICK_TIMES.map(([hour, minute]) => {
              const text = formatTimeOfDay(hour, minute);
              return (
                <Chip
                  accessibilityLabel={`${timeLabel}: ${text}`}
                  key={text}
                  label={text}
                  onPress={() =>
                    onChange(
                      new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute),
                    )
                  }
                  radio
                  selected={Boolean(
                    value && value.getHours() === hour && value.getMinutes() === minute,
                  )}
                />
              );
            })}
          </XStack>
        </YStack>
      ) : null}

      {footer}

      <BottomSheet
        onClose={() => setPickerOpen(false)}
        scrollable
        title={label}
        visible={pickerOpen}
      >
        <YStack gap="$x2" paddingBottom="$x2">
          <XStack alignItems="center" justifyContent="space-between">
            <IconButton
              disabled={Boolean(firstMonth && month <= firstMonth)}
              icon="chevron-left"
              label="Previous month"
              onPress={() => shiftMonth(-1)}
              variant="plain"
            />
            <AppText aria-live="polite" role="heading" variant="bodyStrong">
              {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </AppText>
            <IconButton
              disabled={Boolean(lastMonth && month >= lastMonth)}
              icon="chevron-right"
              label="Next month"
              onPress={() => shiftMonth(1)}
              variant="plain"
            />
          </XStack>
          <XStack aria-hidden>
            {WEEKDAY_INITIALS.map((initial, i) => (
              <AppText center flex={1} key={`${initial}${i}`} tone="muted" variant="caption">
                {initial}
              </AppText>
            ))}
          </XStack>
          {monthGrid(month).map((week) => (
            <XStack key={week.find(Boolean)?.toDateString()}>
              {week.map((day, i) => {
                if (!day) return <YStack flex={1} key={`empty${i}`} minHeight="$touch" />;
                const disabled = outOfRange(day);
                const selected = Boolean(value && sameDay(day, value));
                const isToday = sameDay(day, today);
                return (
                  <YStack
                    alignItems="center"
                    aria-disabled={disabled || undefined}
                    aria-label={longDate(day)}
                    aria-pressed={selected}
                    backgroundColor={selected ? '$primary' : 'transparent'}
                    borderColor={isToday && !selected ? '$primary' : 'transparent'}
                    borderRadius="$pill"
                    borderWidth={1}
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    flex={1}
                    focusVisibleStyle={{
                      outlineWidth: 3,
                      outlineStyle: 'solid',
                      outlineColor: '$outlineColor',
                    }}
                    focusable={!disabled}
                    justifyContent="center"
                    key={day.toDateString()}
                    minHeight="$touch"
                    onPress={
                      disabled
                        ? undefined
                        : () => {
                            pickDay(day);
                            setPickerOpen(false);
                          }
                    }
                    {...keyboardPress(() => {
                      pickDay(day);
                      setPickerOpen(false);
                    }, !disabled)}
                    opacity={disabled ? 0.35 : 1}
                    role="button"
                  >
                    <AppText
                      color={selected ? '$onPrimary' : '$color'}
                      variant={selected || isToday ? 'bodyStrong' : 'body'}
                    >
                      {day.getDate()}
                    </AppText>
                  </YStack>
                );
              })}
            </XStack>
          ))}
        </YStack>
      </BottomSheet>
    </YStack>
  );
}
