import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { COMMUNITY_QUERY_PREFIXES, createPost, listCommunities } from '@/modules/community/api';
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

const TITLE_MAX = 120;
const BODY_MAX = 4000;

/**
 * New post in one of the communities the member joined (the server only lets members post). Opened from a
 * joined community (`?communityId=`) it is preselected.
 */
export function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ communityId?: string }>();

  const [picked, setCommunityId] = useState<string | null>(params.communityId ?? null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ community?: string; title?: string; body?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list'],
    queryFn: listCommunities,
  });
  // Only members can post (the server enforces it), so only joined communities are offered.
  const choices = (communitiesQuery.data ?? []).filter((community) => community.isJoined);

  // A preselected community counts only once it is known to be joined.
  const communityId = picked && choices.some((c) => c.id === picked) ? picked : null;

  const mutation = useMutation({
    mutationFn: (input: { communityId: string; title: string; body: string }) => createPost(input),
    onSuccess: async (post) => {
      await Promise.all(
        COMMUNITY_QUERY_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'community'] });
      router.replace(`/community/posts/${post.id}` as Href);
    },
    onError: (error) => setSubmitError(errorText(error, 'Your post was not published.')),
  });

  const onSubmit = () => {
    const next = {
      community: communityId ? undefined : 'Choose a community.',
      title: title.trim() ? undefined : 'Add a title.',
      body: body.trim() ? undefined : 'Write your post.',
    };
    setErrors(next);
    if (next.community || next.title || next.body || !communityId) return;
    setSubmitError(null);
    mutation.mutate({ communityId, title: title.trim(), body: body.trim() });
  };

  const backTo = (params.communityId ? `/community/${params.communityId}` : '/community') as Href;

  const picker = () => {
    if (communitiesQuery.isLoading) return <LoadingState label="Loading your communities…" />;
    if (communitiesQuery.isError) {
      return (
        <ErrorState
          body={errorText(communitiesQuery.error)}
          compact
          onRetry={() => communitiesQuery.refetch()}
          retryLabel="Retry"
          title="Could not load communities"
        />
      );
    }
    if (choices.length === 0) {
      return (
        <EmptyState
          actionLabel="Discover communities"
          body="Join a community to post in it."
          compact
          iconName="community"
          onAction={() => router.push('/community/discover' as Href)}
          title="You haven't joined a community yet"
        />
      );
    }
    return (
      <YStack gap="$x1">
        <FilterChipRow label="Community" role="radiogroup">
          {choices.map((community) => (
            <Chip
              key={community.id}
              label={community.name}
              onPress={() => {
                setCommunityId(community.id);
                setErrors((e) => ({ ...e, community: undefined }));
              }}
              radio
              selected={communityId === community.id}
            />
          ))}
        </FilterChipRow>
        {errors.community ? (
          <AppText role="alert" tone="danger" variant="caption">
            {errors.community}
          </AppText>
        ) : null}
      </YStack>
    );
  };

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: backTo }} title="Create a post" />

        <YStack gap="$x2">
          <AppText variant="label">Post in</AppText>
          {picker()}
        </YStack>

        <Card gap="$x3">
          <TextField
            error={errors.title}
            helper={`${title.length}/${TITLE_MAX}`}
            label="Title"
            maxLength={TITLE_MAX}
            onChangeText={setTitle}
            placeholder="What would you like to ask or share?"
            value={title}
          />
          <TextField
            error={errors.body}
            helper={`${body.length}/${BODY_MAX}`}
            label="Details"
            maxLength={BODY_MAX}
            multiline
            numberOfLines={6}
            onChangeText={setBody}
            placeholder="Add context, dates, or the question for your neighbours."
            textAlignVertical="top"
            value={body}
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
            disabled={mutation.isPending || choices.length === 0}
            label="Publish"
            loading={mutation.isPending}
            onPress={onSubmit}
          />
        </XStack>
      </YStack>
    </Screen>
  );
}
