import { space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type ExpenseGroup = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type ExpenseGroupsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  groups: ExpenseGroup[];
};

export function ExpenseGroupsScreen() {
  const _colorScheme = useColorScheme();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'groups'],
    queryFn: async (): Promise<ExpenseGroupsContent> => {
      const response = await apiFetch('/api/v1/expenses/groups');
      if (!response.ok) throw new Error(`Groups failed: ${response.status}`);
      return response.json() as Promise<ExpenseGroupsContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading groups..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load groups"
          body="There was a problem loading your expense groups."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          body="Create your first expense group to start tracking shared spending."
          actionLabel="Create group"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.groups.map((group) => (
            <AppButton key={group.id} label={group.title} route={group.route} variant="secondary" />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
});
