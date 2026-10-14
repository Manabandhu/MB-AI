import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { showError } from '@/modules/shared/ui/notify';
import { COMMUNITY_QUERY_PREFIXES, type Community, joinCommunity, leaveCommunity } from './api';

/**
 * Join or leave a community. Leaving asks first. Both refresh every community list, detail and feed on success
 * and show the server's reason on failure.
 */
export function useMembershipToggle() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: ({ community, join }: { community: Community; join: boolean }) =>
      join ? joinCommunity(community.id) : leaveCommunity(community.id),
    onSuccess: () =>
      Promise.all(
        COMMUNITY_QUERY_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
    onError: (error, { join }) => showError(join ? 'Could not join' : 'Could not leave', error),
  });

  const toggle = async (community: Community) => {
    if (community.isJoined) {
      const ok = await confirm({
        title: `Leave ${community.name}?`,
        body: 'Its posts stay visible, but it leaves your communities. You can join again any time.',
        confirmLabel: 'Leave',
        destructive: true,
      });
      if (!ok) return;
    }
    mutation.mutate({ community, join: !community.isJoined });
  };

  return {
    toggle,
    pendingId: mutation.isPending ? mutation.variables?.community.id : undefined,
  };
}
