import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { createEvent, listEventCategories } from '@/modules/events/api';
import {
  addHours,
  defaultEventStart,
  eventTimeErrors,
  nextWeekday,
} from '@/modules/events/utils/eventTime';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { DateTimeField } from '@/modules/shared/ui/DateTimeField';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const DEFAULT_LENGTH_HOURS = 3;

/** "Sat, Oct 18 · 6 PM"; "Tomorrow · 11 AM" when it is tomorrow. */
function presetLabel(date: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day =
    date.toDateString() === tomorrow.toDateString()
      ? 'Tomorrow'
      : date.toDateString() === now.toDateString()
        ? 'Today'
        : formatDate(date, 'weekdayDate');
  return `${day} · ${formatDate(date, 'hour')}`;
}

type Errors = {
  category?: string;
  title?: string;
  location?: string;
  start?: string;
  end?: string;
};

/** Host an event: required category, start and end (end after start), and a place or "Online". */
export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [online, setOnline] = useState(false);
  const [start, setStart] = useState<Date>(() => defaultEventStart());
  const [end, setEnd] = useState<Date>(() => addHours(defaultEventStart(), DEFAULT_LENGTH_HOURS));
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real upcoming dates, computed from today in local time and labelled with the actual date, so a Saturday
  // evening never offers "This Saturday" for next week.
  const presets = useMemo(() => {
    const now = new Date();
    const dates = [nextWeekday(6, 18, now), nextWeekday(0, 11, now), nextWeekday(6, 18, now, 1)];
    return dates
      .sort((a, b) => a.getTime() - b.getTime())
      .map((date) => ({ label: presetLabel(date, now), date }));
  }, []);

  const changeStart = (next: Date) => {
    // Keep the event's length when the start moves.
    const length = Math.max(end.getTime() - start.getTime(), 60 * 60 * 1000);
    setStart(next);
    setEnd(new Date(next.getTime() + length));
  };

  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        title: title.trim(),
        description: description.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        location: online ? 'Online' : location.trim(),
        categoryId: categoryId as string,
      }),
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'explore'] });
      router.replace(`/events/${event.id}` as Href);
    },
    onError: (error) => setSubmitError(errorText(error, 'Your event was not published.')),
  });

  const onSubmit = () => {
    const next: Errors = {
      ...eventTimeErrors(start, end),
      category: categoryId ? undefined : 'Choose a category.',
      title: title.trim() ? undefined : 'Add a title.',
      location: online || location.trim() ? undefined : 'Add a venue or city, or mark it online.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSubmitError(null);
    mutation.mutate();
  };

  const header = <ScreenHeader back={{ fallback: '/events' as Href }} title="Host an event" />;

  if (categoriesQuery.isLoading) {
    return (
      <Screen maxWidth="form">
        {header}
        <LoadingState label="Loading…" />
      </Screen>
    );
  }
  if (categoriesQuery.isError) {
    return (
      <Screen maxWidth="form">
        {header}
        <ErrorState
          body={errorText(categoriesQuery.error)}
          onRetry={() => categoriesQuery.refetch()}
          retryLabel="Retry"
          title="Could not load the form"
        />
      </Screen>
    );
  }
  const categories = categoriesQuery.data ?? [];
  if (categories.length === 0) {
    return (
      <Screen maxWidth="form">
        {header}
        <EmptyState
          body="Event categories have not been set up yet, so events can't be created. Please try again later."
          iconName="event"
          title="Hosting isn't open yet"
        />
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        {header}

        <YStack gap="$x1">
          <AppText variant="label">Category</AppText>
          <FilterChipRow label="Category" role="radiogroup">
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                onPress={() => {
                  setCategoryId(category.id);
                  setErrors((e) => ({ ...e, category: undefined }));
                }}
                radio
                selected={categoryId === category.id}
              />
            ))}
          </FilterChipRow>
          {errors.category ? (
            <AppText role="alert" tone="danger" variant="caption">
              {errors.category}
            </AppText>
          ) : null}
        </YStack>

        <Card gap="$x3">
          <TextField
            error={errors.title}
            label="Title"
            maxLength={200}
            onChangeText={setTitle}
            placeholder="e.g. Diwali Mela, Telugu tech mixer"
            value={title}
          />
          <TextField
            label="Description (optional)"
            maxLength={4000}
            multiline
            numberOfLines={5}
            onChangeText={setDescription}
            placeholder="Agenda, tickets, parking, what to bring"
            textAlignVertical="top"
            value={description}
          />
        </Card>

        <Card gap="$x3">
          <FilterChipRow label="Quick dates">
            {presets.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                onPress={() => changeStart(preset.date)}
                selected={start.getTime() === preset.date.getTime()}
              />
            ))}
          </FilterChipRow>
          <DateTimeField
            error={errors.start}
            label="Starts"
            minimumDate={new Date()}
            mode="datetime"
            onChange={changeStart}
            value={start}
          />
          <DateTimeField
            error={errors.end}
            label="Ends"
            minimumDate={start}
            mode="datetime"
            onChange={setEnd}
            value={end}
          />
        </Card>

        <Card gap="$x3">
          <FilterChipRow label="Where" role="radiogroup">
            <Chip label="In person" onPress={() => setOnline(false)} radio selected={!online} />
            <Chip label="Online" onPress={() => setOnline(true)} radio selected={online} />
          </FilterChipRow>
          {online ? null : (
            <TextField
              error={errors.location}
              label="Venue or address"
              leadingIcon="map-pin"
              maxLength={200}
              onChangeText={setLocation}
              value={location}
            />
          )}
        </Card>

        {submitError ? (
          <AppText role="alert" tone="danger">
            {submitError}
          </AppText>
        ) : null}

        <XStack gap="$x3" justifyContent="flex-end">
          <AppButton
            label="Cancel"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/events' as Href))}
            variant="ghost"
          />
          <AppButton
            disabled={mutation.isPending}
            label="Publish event"
            loading={mutation.isPending}
            onPress={onSubmit}
          />
        </XStack>
      </YStack>
    </Screen>
  );
}
