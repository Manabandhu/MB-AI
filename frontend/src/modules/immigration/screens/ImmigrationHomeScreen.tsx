import { formatDate } from '@manabandhu/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
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
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
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
      <YStack gap="$x4" width="100%">
        <ScreenHeader
          back={{ fallback: (screenId === 'home' ? '/home' : '/immigration') as Href }}
          subtitle={copy.subtitle}
          title={copy.title}
        />
        <ImmigrationSection screenId={screenId} />
      </YStack>
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
    <YStack gap="$x3">
      {/* Latest update: the newest real news item, hidden when there is none */}
      {latestNews[0] ? <LatestUpdateCard item={latestNews[0]} /> : null}

      <XStack flexWrap="wrap" gap="$x2">
        <AppButton label="Resources" route="/immigration/resources" variant="secondary" />
        <AppButton label="Checklists" route="/immigration/checklists" variant="secondary" />
        <AppButton label="FAQ" route="/immigration/faq" variant="secondary" />
      </XStack>

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
    </YStack>
  );
}

function LatestUpdateCard({ item }: { item: ImmigrationNews }) {
  const date = formatDate(item.publishedAt ?? item.createdAt);
  return (
    <Card>
      <AppText tone="teal" variant="overline">
        LATEST UPDATE{item.source ? ` • ${item.source.toUpperCase()}` : ''}
        {date ? ` • ${date}` : ''}
      </AppText>
      <Heading variant="h4">{item.title}</Heading>
      {item.body ? (
        <AppText numberOfLines={4} tone="muted">
          {item.body}
        </AppText>
      ) : null}
      {item.url ? (
        <XStack>
          <AppButton
            icon="globe"
            label="Read source"
            onPress={() => openUrl(item.url as string)}
            size="sm"
            variant="ghost"
          />
        </XStack>
      ) : null}
    </Card>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function CardMeta({ meta }: { meta: unknown[] }) {
  return meta.length > 0 ? (
    <AppText tone="muted" variant="caption">
      {meta.join(' • ')}
    </AppText>
  ) : null;
}

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
    <Card
      aria-expanded={hasContent ? open : undefined}
      gap="$x1"
      onPress={hasContent ? () => setOpen((v) => !v) : undefined}
    >
      <AppText variant="bodyStrong">{guide.title}</AppText>
      {guide.description ? <AppText tone="muted">{guide.description}</AppText> : null}
      {open && hasContent ? <AppText marginTop="$x2">{guide.content}</AppText> : null}
      <CardMeta meta={meta} />
      {hasContent ? (
        <AppText tone="primary" variant="label">
          {open ? 'Hide guide' : 'Read guide'}
        </AppText>
      ) : null}
    </Card>
  );
}

function NewsCard({ item }: { item: ImmigrationNews }) {
  const meta = [item.source, item.category, formatDate(item.publishedAt ?? item.createdAt)].filter(
    Boolean,
  );
  return (
    <Card
      gap="$x1"
      onPress={item.url ? () => openUrl(item.url as string) : undefined}
      role={item.url ? 'link' : undefined}
    >
      <AppText variant="bodyStrong">{item.title}</AppText>
      {item.body ? (
        <AppText numberOfLines={3} tone="muted">
          {item.body}
        </AppText>
      ) : null}
      <CardMeta meta={meta} />
    </Card>
  );
}

function ResourceCard({ resource }: { resource: ImmigrationResource }) {
  const meta = [
    resource.resourceType ? resource.resourceType.toLowerCase() : null,
    resource.category,
    resource.verified ? 'verified by admin' : null,
  ].filter(Boolean);
  return (
    <Card gap="$x1" href={`/immigration/resources/${resource.id}`}>
      <AppText variant="bodyStrong">{resource.title}</AppText>
      {resource.description ? (
        <AppText numberOfLines={3} tone="muted">
          {resource.description}
        </AppText>
      ) : null}
      <CardMeta meta={meta} />
    </Card>
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
    <Card gap="$x1">
      <AppText variant="bodyStrong">{checklist.title}</AppText>
      {checklist.description ? <AppText tone="muted">{checklist.description}</AppText> : null}
      <CardMeta meta={meta} />
    </Card>
  );
}

function FaqCard({ item }: { item: ImmigrationFaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Card aria-expanded={open} gap="$x1" onPress={() => setOpen((v) => !v)}>
      <AppText variant="bodyStrong">{item.question}</AppText>
      {open ? <AppText tone="muted">{item.answer}</AppText> : null}
      {item.category ? (
        <AppText tone="muted" variant="caption">
          {item.category}
        </AppText>
      ) : null}
    </Card>
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
  return <YStack gap="$x3">{items.map((item) => render(item))}</YStack>;
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
