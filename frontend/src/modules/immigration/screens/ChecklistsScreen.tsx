import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

type ChecklistItem = {
  id: string;
  title: string;
  body: string;
  checked?: boolean;
};

type ChecklistsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: ChecklistItem[];
};

export function ChecklistsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'checklists'],
    queryFn: async (): Promise<ChecklistsContent> => {
      const response = await apiFetch('/api/v1/immigration/checklists');
      if (!response.ok) throw new Error(`Checklists failed: ${response.status}`);
      return response.json() as Promise<ChecklistsContent>;
    },
  });

  const fallback: ChecklistsContent = {
    eyebrow: 'Immigration',
    title: 'Checklists',
    subtitle: 'Document checklists for immigration processes.',
    items: [
      { id: '1', title: 'Passport copy', body: 'Valid for at least 6 months.', checked: true },
      { id: '2', title: 'I-20 form', body: 'Signed by DSO.', checked: false },
      {
        id: '3',
        title: 'Financial proof',
        body: 'Bank statements or sponsor letter.',
        checked: false,
      },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading checklists...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load checklists"
          body="There was a problem loading checklists."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.items.length === 0 ? (
        <EmptyState
          title="No checklists"
          body="Checklists will appear here."
          actionLabel="Browse guides"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]} />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
  itemCard: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    padding: space.x4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderColor: color.border,
    borderWidth: 2,
  },
  checkboxChecked: { backgroundColor: color.teal, borderColor: color.teal },
  itemText: { flex: 1 },
  itemTitle: {
    color: color.ink,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  itemBody: { color: color.muted, fontSize: typography.body.fontSize },
});
