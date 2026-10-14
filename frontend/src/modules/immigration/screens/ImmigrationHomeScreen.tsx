import { formatDate } from '@manabandhu/core';
import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import {
  type ImmigrationChecklist,
  type ImmigrationFaqItem,
  type ImmigrationGuide,
  type ImmigrationNews,
  type ImmigrationResource,
  listImmigrationChecklists,
  listImmigrationFaq,
  listImmigrationGuides,
  listImmigrationNews,
  listImmigrationResources,
} from '@/modules/immigration/api';
import { openUrl } from '@/modules/immigration/utils/openUrl';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Heading } from '@/modules/shared/ui/AppText';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

const immigrationRoutes = {
  home: '/immigration',
  resources: '/immigration/resources',
  guides: '/immigration/guides',
  checklists: '/immigration/checklists',
  faq: '/immigration/faq',
  questions: '/immigration/questions',
  uscis: '/immigration/uscis',
  news: '/immigration/news',
  saved: '/immigration/saved',
} as const;

type ImmigrationScreenId = keyof typeof immigrationRoutes;

type ImmigrationScreenProps = {
  screenId: ImmigrationScreenId;
};

/** Static section copy only; every list and count below comes from the immigration API. */
const SCREEN_COPY: Record<ImmigrationScreenId, { title: string; subtitle: string }> = {
  home: {
    title: 'Immigration & Visa Hub',
    subtitle: 'Guides, news, checklists, and resources shared with the community.',
  },
  resources: { title: 'Resource Library', subtitle: 'Forms, links, and reference documents.' },
  guides: { title: 'Guides', subtitle: 'Step-by-step walkthroughs for common filings.' },
  checklists: { title: 'Checklists', subtitle: 'Document checklists for filings and interviews.' },
  faq: { title: 'Frequently Asked Questions', subtitle: 'Answers to common questions.' },
  questions: {
    title: 'Ask a question',
    subtitle: 'Questions are answered by members in Community.',
  },
  uscis: { title: 'USCIS Updates', subtitle: 'News items published from USCIS sources.' },
  news: { title: 'Immigration News', subtitle: 'Policy and processing updates.' },
  saved: { title: 'Saved', subtitle: 'Your bookmarked guides and checklists.' },
};

function checklistItemCount(itemsJson?: string | null): number | null {
  if (!itemsJson) return null;
  try {
    const parsed: unknown = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed.length : null;
  } catch {
    return null;
  }
}

export function ImmigrationScreen({ screenId }: ImmigrationScreenProps) {
  const copy = SCREEN_COPY[screenId];
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey: ['immigration'], type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <View style={s.container}>
        <ScreenHeader
          back={screenId === 'home' ? false : { fallback: '/immigration' as Href }}
          subtitle={copy.subtitle}
          title={copy.title}
        />
        <ImmigrationSection screenId={screenId} />
      </View>
    </Screen>
  );
}

function ImmigrationSection({ screenId }: ImmigrationScreenProps) {
  switch (screenId) {
    case 'home':
      return <ImmigrationHome />;
    case 'guides':
      return <GuidesList />;
    case 'news':
      return <NewsList />;
    case 'uscis':
      return <NewsList uscisOnly />;
    case 'resources':
      return <ResourcesList />;
    case 'checklists':
      return <ChecklistsList />;
    case 'faq':
      return <FaqList />;
    case 'questions':
      return <AskInCommunity />;
    case 'saved':
      return <SavedPlaceholder />;
    default:
      return null;
  }
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function ImmigrationHome() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const guides = useQuery({
    queryKey: ['immigration', 'guides'],
    queryFn: () => listImmigrationGuides(),
  });
  const news = useQuery({ queryKey: ['immigration', 'news'], queryFn: listImmigrationNews });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const guide of guides.data ?? []) if (guide.category) set.add(guide.category);
    return Array.from(set).sort();
  }, [guides.data]);

  const visibleGuides = (guides.data ?? []).filter(
    (g) => activeCategory === 'all' || g.category === activeCategory,
  );
  const latestNews = (news.data ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    );

  return (
    <View style={s.stack}>
      {/* Latest update: the newest real news item, hidden when there is none */}
      {latestNews[0] ? <LatestUpdateCard item={latestNews[0]} /> : null}

      <View style={s.linkRow}>
        <AppButton label="Resources" route="/immigration/resources" variant="secondary" />
        <AppButton label="Checklists" route="/immigration/checklists" variant="secondary" />
        <AppButton label="FAQ" route="/immigration/faq" variant="secondary" />
      </View>

      <Heading variant="h4">Guides</Heading>
      {guides.isLoading ? (
        <LoadingState label="Loading guides..." />
      ) : guides.isError ? (
        <ErrorState
          title="Unable to load guides"
          body={guides.error instanceof Error ? guides.error.message : 'Please try again.'}
          retryLabel="Retry"
          onRetry={() => guides.refetch()}
        />
      ) : (guides.data ?? []).length === 0 ? (
        <EmptyState
          title="No guides yet"
          body="Guides will appear here once they are published."
          actionLabel="Browse resources"
          onAction={() => router.push('/immigration/resources' as Href)}
        />
      ) : (
        <>
          {categories.length > 1 ? (
            <FilterChipRow label="Guide category" role="radiogroup">
              {['all', ...categories].map((cat) => (
                <Chip
                  key={cat}
                  label={cat === 'all' ? 'All' : cat}
                  onPress={() => setActiveCategory(cat)}
                  radio
                  selected={activeCategory === cat}
                />
              ))}
            </FilterChipRow>
          ) : null}
          {visibleGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </>
      )}

      <Heading variant="h4">Recent news</Heading>
      {news.isLoading ? (
        <LoadingState label="Loading news..." />
      ) : news.isError ? (
        <ErrorState
          title="Unable to load news"
          body={news.error instanceof Error ? news.error.message : 'Please try again.'}
          retryLabel="Retry"
          onRetry={() => news.refetch()}
        />
      ) : latestNews.length === 0 ? (
        <EmptyState
          title="No news yet"
          body="Immigration updates will appear here once they are published."
          actionLabel="Browse guides"
          onAction={() => router.push('/immigration/guides' as Href)}
        />
      ) : (
        latestNews.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)
      )}
    </View>
  );
}

function LatestUpdateCard({ item }: { item: ImmigrationNews }) {
  const date = formatDate(item.publishedAt ?? item.createdAt);
  return (
    <View style={s.heroCard}>
      <Text style={s.heroTag}>
        LATEST UPDATE{item.source ? ` • ${item.source.toUpperCase()}` : ''}
        {date ? ` • ${date}` : ''}
      </Text>
      <Text style={s.heroTitle}>{item.title}</Text>
      {item.body ? (
        <Text numberOfLines={4} style={s.heroBody}>
          {item.body}
        </Text>
      ) : null}
      {item.url ? (
        <Pressable onPress={() => openUrl(item.url as string)} style={s.heroLink}>
          <Text style={s.heroLinkText}>Read source ↗</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function GuideCard({ guide }: { guide: ImmigrationGuide }) {
  const meta = [
    guide.category,
    guide.difficultyLevel ? guide.difficultyLevel.toLowerCase() : null,
    guide.estimatedDurationMinutes ? `${guide.estimatedDurationMinutes} min` : null,
    formatDate(guide.createdAt),
  ].filter(Boolean);
  const [open, setOpen] = useState(false);
  const hasContent = Boolean(guide.content?.trim());
  return (
    <Pressable
      accessibilityHint={
        hasContent ? (open ? 'Hides the guide' : 'Shows the full guide') : undefined
      }
      accessibilityRole={hasContent ? 'button' : undefined}
      accessibilityState={hasContent ? { expanded: open } : undefined}
      disabled={!hasContent}
      onPress={() => setOpen((v) => !v)}
      style={s.card}
    >
      <Text style={s.cardTitle}>{guide.title}</Text>
      {guide.description ? <Text style={s.cardBody}>{guide.description}</Text> : null}
      {open && hasContent ? <Text style={s.guideContent}>{guide.content}</Text> : null}
      {meta.length > 0 ? <Text style={s.cardMeta}>{meta.join(' • ')}</Text> : null}
      {hasContent ? <Text style={s.cardAction}>{open ? 'Hide guide' : 'Read guide'}</Text> : null}
    </Pressable>
  );
}

function NewsCard({ item }: { item: ImmigrationNews }) {
  const meta = [item.source, item.category, formatDate(item.publishedAt ?? item.createdAt)].filter(
    Boolean,
  );
  return (
    <Pressable
      disabled={!item.url}
      onPress={() => item.url && openUrl(item.url)}
      style={s.card}
      accessibilityRole={item.url ? 'link' : undefined}
    >
      <Text style={s.cardTitle}>{item.title}</Text>
      {item.body ? (
        <Text numberOfLines={3} style={s.cardBody}>
          {item.body}
        </Text>
      ) : null}
      {meta.length > 0 ? <Text style={s.cardMeta}>{meta.join(' • ')}</Text> : null}
    </Pressable>
  );
}

function ResourceCard({ resource }: { resource: ImmigrationResource }) {
  const router = useRouter();
  const meta = [
    resource.resourceType ? resource.resourceType.toLowerCase() : null,
    resource.category,
    resource.verified ? 'verified by admin' : null,
  ].filter(Boolean);
  return (
    <Pressable
      onPress={() => router.push(`/immigration/resources/${resource.id}` as Href)}
      style={s.card}
      accessibilityRole="button"
    >
      <Text style={s.cardTitle}>{resource.title}</Text>
      {resource.description ? (
        <Text numberOfLines={3} style={s.cardBody}>
          {resource.description}
        </Text>
      ) : null}
      {meta.length > 0 ? <Text style={s.cardMeta}>{meta.join(' • ')}</Text> : null}
    </Pressable>
  );
}

function ChecklistCard({ checklist }: { checklist: ImmigrationChecklist }) {
  const count = checklistItemCount(checklist.itemsJson);
  const meta = [
    checklist.category,
    count !== null ? `${count} ${count === 1 ? 'item' : 'items'}` : null,
    checklist.dueDate ? `due ${formatDate(checklist.dueDate)}` : null,
  ].filter(Boolean);
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{checklist.title}</Text>
      {checklist.description ? <Text style={s.cardBody}>{checklist.description}</Text> : null}
      {meta.length > 0 ? <Text style={s.cardMeta}>{meta.join(' • ')}</Text> : null}
    </View>
  );
}

function FaqCard({ item }: { item: ImmigrationFaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((v) => !v)}
      style={s.card}
    >
      <Text style={s.cardTitle}>{item.question}</Text>
      {open ? <Text style={s.cardBody}>{item.answer}</Text> : null}
      {item.category ? <Text style={s.cardMeta}>{item.category}</Text> : null}
    </Pressable>
  );
}

// ─── Lists ────────────────────────────────────────────────────────────────────

type ListQuery<T> = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: T[] | undefined;
  refetch: () => unknown;
};

function QueryList<T extends { id: string }>({
  query,
  noun,
  emptyBody,
  render,
}: {
  query: ListQuery<T>;
  noun: string;
  emptyBody: string;
  render: (item: T) => React.ReactNode;
}) {
  const router = useRouter();
  if (query.isLoading) return <LoadingState label={`Loading ${noun}...`} />;
  if (query.isError) {
    return (
      <ErrorState
        title={`Unable to load ${noun}`}
        body={query.error instanceof Error ? query.error.message : 'Please try again.'}
        retryLabel="Retry"
        onRetry={() => query.refetch()}
      />
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title={`No ${noun} yet`}
        body={emptyBody}
        actionLabel="Immigration home"
        onAction={() => router.push('/immigration' as Href)}
      />
    );
  }
  return <View style={s.stack}>{items.map((item) => render(item))}</View>;
}

function GuidesList() {
  const query = useQuery({
    queryKey: ['immigration', 'guides'],
    queryFn: () => listImmigrationGuides(),
  });
  return (
    <QueryList
      query={query}
      noun="guides"
      emptyBody="Guides will appear here once they are published."
      render={(guide) => <GuideCard key={guide.id} guide={guide} />}
    />
  );
}

function NewsList({ uscisOnly = false }: { uscisOnly?: boolean }) {
  const query = useQuery({ queryKey: ['immigration', 'news'], queryFn: listImmigrationNews });
  const data = uscisOnly
    ? query.data?.filter((n) =>
        `${n.source ?? ''} ${n.category ?? ''} ${n.url ?? ''}`.toLowerCase().includes('uscis'),
      )
    : query.data;
  return (
    <QueryList
      query={{ ...query, data }}
      noun={uscisOnly ? 'USCIS updates' : 'news'}
      emptyBody="Updates will appear here once they are published."
      render={(item) => <NewsCard key={item.id} item={item} />}
    />
  );
}

function ResourcesList() {
  const query = useQuery({
    queryKey: ['immigration', 'resources'],
    queryFn: () => listImmigrationResources(),
  });
  return (
    <QueryList
      query={query}
      noun="resources"
      emptyBody="Resources will appear here once they are shared."
      render={(resource) => <ResourceCard key={resource.id} resource={resource} />}
    />
  );
}

function ChecklistsList() {
  const router = useRouter();
  const authStatus = useAuthStore((st) => st.status);
  const query = useQuery({
    queryKey: ['immigration', 'checklists'],
    queryFn: () => listImmigrationChecklists(),
    // Checklists are personal; the endpoint requires a signed-in member.
    enabled: authStatus === 'authenticated',
  });
  if (authStatus === 'unauthenticated') {
    return (
      <EmptyState
        title="Sign in to see your checklists"
        body="Checklists are private to your account."
        actionLabel="Sign in"
        onAction={() => router.push('/sign-in' as Href)}
      />
    );
  }
  if (authStatus === 'loading') return <LoadingState label="Loading checklists..." />;
  return (
    <QueryList
      query={query}
      noun="checklists"
      emptyBody="Checklists you create will appear here."
      render={(checklist) => <ChecklistCard key={checklist.id} checklist={checklist} />}
    />
  );
}

function FaqList() {
  const query = useQuery({ queryKey: ['immigration', 'faq'], queryFn: () => listImmigrationFaq() });
  return (
    <QueryList
      query={query}
      noun="questions"
      emptyBody="Answered questions will appear here once they are published."
      render={(item) => <FaqCard key={item.id} item={item} />}
    />
  );
}

function AskInCommunity() {
  const router = useRouter();
  return (
    <EmptyState
      title="Ask the community"
      body="Post your visa or immigration question in Community, where members who have been through it can answer. Common questions are already answered in the FAQ."
      actionLabel="Ask in Community"
      onAction={() => router.push('/community/create-post' as Href)}
      secondaryActionLabel="Read the FAQ"
      onSecondaryAction={() => router.push('/immigration/faq' as Href)}
    />
  );
}

function SavedPlaceholder() {
  const router = useRouter();
  return (
    <EmptyState
      title="Nothing saved"
      body="Saving immigration guides is not available yet. Browse guides and resources instead."
      actionLabel="Browse guides"
      onAction={() => router.push('/immigration/guides' as Href)}
    />
  );
}

const s = StyleSheet.create({
  container: { width: '100%', gap: space.x4 },
  stack: { gap: space.x3 },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  heroCard: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.x4,
    gap: space.x2,
  },
  heroTag: { color: color.teal, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: color.ink, fontSize: 18, fontWeight: '800' },
  heroBody: { color: color.muted, fontSize: 14, lineHeight: 20 },
  heroLink: { alignSelf: 'flex-start', paddingVertical: space.x1 },
  heroLinkText: { color: color.primary, fontWeight: '700' },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.x4,
    gap: space.x1,
  },
  cardTitle: { color: color.ink, fontSize: 15, fontWeight: '700' },
  cardBody: { color: color.muted, fontSize: 14, lineHeight: 20 },
  cardMeta: { color: color.muted, fontSize: 12, marginTop: space.x1 },
  cardAction: { color: color.primary, fontSize: 13, fontWeight: '700', marginTop: space.x1 },
  guideContent: {
    color: color.ink,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space.x2,
  },
});
