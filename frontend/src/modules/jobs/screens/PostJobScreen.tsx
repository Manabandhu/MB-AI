import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  createJobPosting,
  getJobPosting,
  listJobCategories,
  updateJobPosting,
} from '@/modules/jobs/api';
import { EMPLOYMENT_TYPES } from '@/modules/jobs/types';
import {
  EMPTY_JOB_FORM,
  fromJob,
  type JobFormValues,
  jobFormSchema,
  toJobInput,
  toJobUpdate,
} from '@/modules/jobs/utils/jobForm';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

function FieldError({ message }: { message?: string }) {
  return message ? (
    <AppText role="alert" tone="danger" variant="caption">
      {message}
    </AppText>
  ) : null;
}

/** Post a job (`/jobs/post`) or edit your own (`/jobs/post?jobId=…`). */
export function PostJobScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const editing = Boolean(jobId);
  const userId = useAuthStore((s) => s.user?.id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['jobs', 'categories'],
    queryFn: listJobCategories,
  });
  const jobQuery = useQuery({
    // `mine` depends on who is asking, so the viewer is part of the key.
    queryKey: ['jobs', 'detail', jobId, userId ?? null],
    queryFn: () => getJobPosting(String(jobId)),
    enabled: editing,
  });

  const { control, handleSubmit, reset } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: EMPTY_JOB_FORM,
  });

  useEffect(() => {
    if (jobQuery.data) reset(fromJob(jobQuery.data));
  }, [jobQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: JobFormValues) =>
      editing
        ? updateJobPosting(String(jobId), toJobUpdate(values))
        : createJobPosting(toJobInput(values)),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'explore'] });
      router.replace(`/jobs/${job.id}` as Href);
    },
    onError: (error) =>
      setSubmitError(
        errorText(error, editing ? 'Your changes were not saved.' : 'Your job was not posted.'),
      ),
  });

  const backTo = (editing ? `/jobs/${jobId}` : '/jobs') as Href;
  const header = (
    <ScreenHeader back={{ fallback: backTo }} title={editing ? 'Edit job' : 'Post a job'} />
  );

  if (categoriesQuery.isLoading || (editing && jobQuery.isLoading)) {
    return (
      <Screen maxWidth="form">
        {header}
        <LoadingState label="Loading…" />
      </Screen>
    );
  }
  if (categoriesQuery.isError || (editing && jobQuery.isError)) {
    const error = categoriesQuery.error ?? jobQuery.error;
    return (
      <Screen maxWidth="form">
        {header}
        <ErrorState
          body={errorText(error)}
          onRetry={() => {
            categoriesQuery.refetch();
            if (editing) jobQuery.refetch();
          }}
          retryLabel="Retry"
          title="Could not load the form"
        />
      </Screen>
    );
  }
  if (editing && jobQuery.data && jobQuery.data.mine !== true) {
    return (
      <Screen maxWidth="form">
        {header}
        <EmptyState body="Only the person who posted this job can edit it." title="Not your job" />
      </Screen>
    );
  }
  const categories = categoriesQuery.data ?? [];
  if (categories.length === 0) {
    return (
      <Screen maxWidth="form">
        {header}
        <EmptyState
          body="Job categories have not been set up yet, so jobs can't be posted. Please try again later."
          iconName="briefcase"
          title="Posting isn't open yet"
        />
      </Screen>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    mutation.mutate(values);
  });

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        {header}

        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <YStack gap="$x1">
              <AppText variant="label">Category</AppText>
              <FilterChipRow label="Category" role="radiogroup">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onPress={() => field.onChange(category.id)}
                    radio
                    selected={field.value === category.id}
                  />
                ))}
              </FilterChipRow>
              <FieldError message={fieldState.error?.message} />
            </YStack>
          )}
        />

        <Card gap="$x3">
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Job title"
                maxLength={200}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="e.g. Senior Backend Engineer"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="company"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Company (optional)"
                maxLength={200}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Location (optional)"
                leadingIcon="map-pin"
                maxLength={200}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="City, state"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="isRemote"
            render={({ field }) => (
              <FilterChipRow label="Work model" role="radiogroup">
                <Chip
                  label="On-site / hybrid"
                  onPress={() => field.onChange(false)}
                  radio
                  selected={!field.value}
                />
                <Chip
                  label="Remote OK"
                  onPress={() => field.onChange(true)}
                  radio
                  selected={field.value}
                />
              </FilterChipRow>
            )}
          />
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <YStack gap="$x1">
                <AppText variant="label">Type (optional)</AppText>
                <FilterChipRow label="Employment type" role="radiogroup">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      onPress={() => field.onChange(field.value === type ? '' : type)}
                      radio
                      selected={field.value === type}
                    />
                  ))}
                </FilterChipRow>
              </YStack>
            )}
          />
        </Card>

        <Card gap="$x3">
          <XStack flexWrap="wrap" gap="$x3">
            <YStack flexBasis={180} flexGrow={1}>
              <Controller
                control={control}
                name="salaryMin"
                render={({ field, fieldState }) => (
                  <TextField
                    error={fieldState.error?.message}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    label="Salary from (USD/yr, optional)"
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </YStack>
            <YStack flexBasis={180} flexGrow={1}>
              <Controller
                control={control}
                name="salaryMax"
                render={({ field, fieldState }) => (
                  <TextField
                    error={fieldState.error?.message}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    label="Salary to (optional)"
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </YStack>
          </XStack>
          <Controller
            control={control}
            name="applicationUrl"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                error={fieldState.error?.message}
                helper="Where candidates can also apply on the employer's site."
                inputMode="url"
                keyboardType="url"
                label="Application link (optional)"
                maxLength={500}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="https://"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Description"
                maxLength={4000}
                multiline
                numberOfLines={6}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Responsibilities, requirements, visa sponsorship…"
                textAlignVertical="top"
                value={field.value}
              />
            )}
          />
        </Card>

        {submitError ? (
          <AppText role="alert" tone="danger">
            {submitError}
          </AppText>
        ) : null}

        <XStack gap="$x3" justifyContent="flex-end">
          <AppButton
            label="Cancel"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo))}
            variant="ghost"
          />
          <AppButton
            disabled={mutation.isPending}
            label={editing ? 'Save changes' : 'Post job'}
            loading={mutation.isPending}
            onPress={onSubmit}
          />
        </XStack>
      </YStack>
    </Screen>
  );
}
