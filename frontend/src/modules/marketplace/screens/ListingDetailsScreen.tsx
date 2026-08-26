import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type ListingDetailContent = {
  title: string;
  body: string;
  eyebrow: string;
  meta?: string;
};

type ListingDetailsScreenProps = {
  listingId: string;
};

export function ListingDetailsScreen({ listingId }: ListingDetailsScreenProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace', 'listing', listingId],
    queryFn: async (): Promise<ListingDetailContent> => {
      const response = await apiFetch(`/api/v1/marketplace/${listingId}`);
      if (!response.ok) throw new Error(`Listing failed: ${response.status}`);
      return response.json() as Promise<ListingDetailContent>;
    },
  });

  const fallback: ListingDetailContent = {
    eyebrow: 'Marketplace',
    title: 'Vintage camera',
    body: 'Good condition with original box and strap. Tested and working. Pickup in Irving preferred.',
    meta: '$120 · Irving',
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load listing"
          body="There was a problem loading this listing."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.meta} />
      <Text style={styles.body}>{content.body}</Text>
      <View style={styles.actions}>
        <AppButton label="Message seller" route="/marketplace/saved" />
        <AppButton label="Save item" route="/marketplace/saved" variant="secondary" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: color.ink,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space.x4,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x6 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});
