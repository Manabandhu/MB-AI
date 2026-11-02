import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

/**
 * `/jobs/saved`: the backend has no saved-jobs endpoint, so nothing is stored or shown as saved. Kept only so
 * older links land somewhere honest; nothing in the app links here.
 */
export function SavedJobsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: '/jobs' as Href }} title="Saved jobs" />
        <EmptyState
          actionLabel="Browse jobs"
          body="Saving jobs isn't available yet. Open a job to apply or share its link."
          iconName="briefcase"
          onAction={() => router.replace('/jobs' as Href)}
          title="Nothing saved"
        />
      </YStack>
    </Screen>
  );
}
