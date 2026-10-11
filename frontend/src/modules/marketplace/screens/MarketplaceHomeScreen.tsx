import { breakpoint } from '@manabandhu/design-system';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { getSavedListings, listMarketplaceCategories, searchMarketplaceListings } from '../api';
import { ListingCard } from '../components/ListingBits';
import { useListingSave } from '../hooks/useListingSave';
import type { ListingCategory, ListingFilters, MarketplaceListing } from '../types';
import { CONDITIONS, errorMessage, PAGE_SIZE } from '../utils/listingRules';

type MarketplaceScreenId = 'home' | 'search' | 'categories' | 'saved';

const PRICE_OPTIONS = [
  { label: 'Any price', value: null },
  { label: 'Free', value: 0 },
  { label: 'Under $25', value: 25 },
  { label: 'Under $50', value: 50 },
  { label: 'Under $100', value: 100 },
] as const;

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Marketplace browse screen. `/marketplace/search` focuses the search field, `/marketplace/categories` opens the
 * category picker, and `/marketplace/saved` shows the signed-in member's saved listings.
 */
export function MarketplaceHomeScreen({ screenId = 'home' }: { screenId?: MarketplaceScreenId }) {
  if (screenId === 'saved') return <SavedListingsView />;
  return <BrowseView screenId={screenId} />;
}

function useGridColumns() {
  const { width } = useAdaptiveLayout();
  // Very narrow cover screens get one full-width card per row.
  return { compact: width < breakpoint.narrow ? 1 : 2, medium: 3, expanded: 4, wide: 4 } as const;
}

function BrowseView({ screenId }: { screenId: Exclude<MarketplaceScreenId, 'saved'> }) {
  const router = useRouter();
  const columns = useGridColumns();
  const { isSaved, toggle } = useListingSave();

  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(screenId === 'categories');
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filters: ListingFilters = useMemo(
    () => ({ q: query, categoryId: category?.id ?? null, condition, maxPrice, includeClosed }),
    [query, category, condition, maxPrice, includeClosed],
  );
  const filtersActive = Boolean(
    query || category || condition || maxPrice !== null || includeClosed,
  );

  const listingsQuery = useInfiniteQuery({
    queryKey: ['marketplace', 'listings', filters],
    queryFn: ({ pageParam }) => searchMarketplaceListings(filters, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.last === true || last.number + 1 >= last.totalPages ? undefined : last.number + 1,
  });
  const categoriesQuery = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: listMarketplaceCategories,
    staleTime: 10 * 60_000,
  });

  const listings = useMemo(() => {
    // Newer listings can shift later pages; drop any repeats.
    const seen = new Set<string>();
    const out: MarketplaceListing[] = [];
    for (const page of listingsQuery.data?.pages ?? []) {
      for (const item of page.content) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [listingsQuery.data]);
  const total = listingsQuery.data?.pages[0]?.totalElements ?? 0;

  const refresh = async () => {
    setPulling(true);
    try {
      await Promise.allSettled([listingsQuery.refetch(), categoriesQuery.refetch()]);
    } finally {
      setPulling(false);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setQuery('');
    setCategory(null);
    setCondition(null);
    setMaxPrice(null);
    setIncludeClosed(false);
  };

  const openListing = (id: string) => router.push(`/marketplace/${id}` as Href);

  return (
    <Screen onRefresh={refresh} refreshing={pulling}>
      <YStack gap="$x4">
        <XStack alignItems="center" gap="$x2">
          <BackButton fallback="/home" />
          <YStack flex={1}>
            <AppText role="heading" variant="h2">
              Marketplace
            </AppText>
            <AppText tone="muted" variant="caption">
              Buy, sell and give away with people nearby
            </AppText>
          </YStack>
        </XStack>

        <MarketplaceNav />

        <XStack alignItems="flex-end" gap="$x2">
          <YStack flex={1}>
            <TextField
              aria-label="Search listings"
              autoFocus={screenId === 'search'}
              onChangeText={setSearchText}
              onSubmitEditing={() => setQuery(searchText.trim())}
              placeholder="Search furniture, kitchen, books…"
              returnKeyType="search"
              value={searchText}
            />
          </YStack>
          {searchText ? (
            <IconButton
              icon="close"
              label="Clear search"
              onPress={() => {
                setSearchText('');
                setQuery('');
              }}
            />
          ) : null}
        </XStack>

        <CategoryChips
          error={categoriesQuery.isError ? errorMessage(categoriesQuery.error) : null}
          loading={categoriesQuery.isLoading}
          onOpenPicker={() => setCategorySheetOpen(true)}
          onRetry={() => categoriesQuery.refetch()}
          onSelect={setCategory}
          selected={category}
          categories={categoriesQuery.data ?? []}
        />

        <YStack gap="$x2">
          <ChipRow label="Condition">
            <Chip label="Any condition" onPress={() => setCondition(null)} selected={!condition} />
            {CONDITIONS.map((c) => (
              <Chip
                key={c.id}
                label={c.id}
                onPress={() => setCondition(condition === c.id ? null : c.id)}
                selected={condition === c.id}
              />
            ))}
          </ChipRow>
          <ChipRow label="Price">
            {PRICE_OPTIONS.map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                onPress={() => setMaxPrice(p.value)}
                selected={maxPrice === p.value}
              />
            ))}
            <Chip
              accessibilityLabel="Include reserved and sold items"
              label="Show reserved & sold"
              onPress={() => setIncludeClosed((v) => !v)}
              selected={includeClosed}
            />
          </ChipRow>
        </YStack>

        <XStack alignItems="center" justifyContent="space-between">
          <AppText aria-live="polite" tone="muted" variant="label">
            {listingsQuery.isSuccess ? `${total} ${total === 1 ? 'item' : 'items'}` : ' '}
          </AppText>
          {filtersActive ? (
            <AppButton label="Clear filters" onPress={clearFilters} variant="ghost" />
          ) : null}
        </XStack>

        {listingsQuery.isLoading ? (
          <LoadingState count={4} label="Loading listings…" variant="skeleton" />
        ) : listingsQuery.isError && listings.length === 0 ? (
          <ErrorState
            body={errorMessage(listingsQuery.error)}
            onRetry={() => listingsQuery.refetch()}
            retryLabel="Retry"
            title="Could not load listings"
          />
        ) : listings.length === 0 ? (
          filtersActive ? (
            <EmptyState
              actionLabel="Clear filters"
              body="Nothing matches these filters. Try another search or category."
              iconName="search"
              onAction={clearFilters}
              title="No matching items"
            />
          ) : (
            <EmptyState
              actionLabel="Sell an item"
              body="No one has listed anything yet. Be the first to sell or give something away."
              iconName="marketplace"
              onAction={() => router.push('/marketplace/sell' as Href)}
              title="Nothing for sale yet"
            />
          )
        ) : (
          <YStack gap="$x3">
            <ResponsiveGrid columns={columns} gap={12}>
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onPress={() => openListing(item.id)}
                  onToggleSave={item.isMine ? undefined : () => toggle(item)}
                  saved={isSaved(item)}
                />
              ))}
            </ResponsiveGrid>
            {listingsQuery.isFetchNextPageError ? (
              <ErrorState
                body={errorMessage(listingsQuery.error)}
                compact
                onRetry={() => listingsQuery.fetchNextPage()}
                retryLabel="Retry"
                title="Could not load more"
              />
            ) : listingsQuery.hasNextPage ? (
              <AppButton
                fullWidth
                label={`Load more (${listings.length} of ${total})`}
                loading={listingsQuery.isFetchingNextPage}
                onPress={() => listingsQuery.fetchNextPage()}
                variant="secondary"
              />
            ) : null}
          </YStack>
        )}
      </YStack>

      <CategorySheet
        categories={categoriesQuery.data ?? []}
        error={categoriesQuery.isError ? errorMessage(categoriesQuery.error) : null}
        loading={categoriesQuery.isLoading}
        onClose={() => setCategorySheetOpen(false)}
        onRetry={() => categoriesQuery.refetch()}
        onSelect={(c) => {
          setCategory(c);
          setCategorySheetOpen(false);
        }}
        selected={category}
        visible={categorySheetOpen}
      />
    </Screen>
  );
}

/** Sell / My listings / Saved, visible on every window size. */
function MarketplaceNav() {
  const router = useRouter();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const go = (route: string) => router.push((signedIn ? route : '/sign-in') as Href);
  return (
    <XStack flexWrap="wrap" gap="$x2">
      <AppButton icon="plus" label="Sell an item" onPress={() => go('/marketplace/sell')} />
      <AppButton
        icon="package"
        label="My listings"
        onPress={() => go('/marketplace/mine')}
        variant="secondary"
      />
      <AppButton
        icon="heart"
        label="Saved"
        onPress={() => go('/marketplace/saved')}
        variant="secondary"
      />
    </XStack>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ScrollView
      accessibilityLabel={label}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      <XStack gap="$x2" paddingVertical={4}>
        {children}
      </XStack>
    </ScrollView>
  );
}

function CategoryChips({
  categories,
  selected,
  loading,
  error,
  onSelect,
  onRetry,
  onOpenPicker,
}: {
  categories: ListingCategory[];
  selected: ListingCategory | null;
  loading: boolean;
  error: string | null;
  onSelect: (c: ListingCategory | null) => void;
  onRetry: () => void;
  onOpenPicker: () => void;
}) {
  if (error) {
    return (
      <XStack alignItems="center" gap="$x2">
        <AppText flex={1} tone="danger" variant="caption">
          Categories could not be loaded. {error}
        </AppText>
        <AppButton label="Retry" onPress={onRetry} variant="ghost" />
      </XStack>
    );
  }
  if (loading) {
    return (
      <AppText tone="muted" variant="caption">
        Loading categories…
      </AppText>
    );
  }
  return (
    <ChipRow label="Category">
      <Chip label="All categories" onPress={() => onSelect(null)} selected={!selected} />
      {selected && !categories.slice(0, 8).some((c) => c.id === selected.id) ? (
        <Chip label={selected.name} onPress={() => onSelect(null)} selected />
      ) : null}
      {categories.slice(0, 8).map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          onPress={() => onSelect(selected?.id === c.id ? null : c)}
          selected={selected?.id === c.id}
        />
      ))}
      {categories.length > 8 ? (
        <Chip
          accessibilityLabel="Show all categories"
          icon="filter-list"
          label="More"
          onPress={onOpenPicker}
        />
      ) : null}
    </ChipRow>
  );
}

function CategorySheet({
  visible,
  onClose,
  categories,
  selected,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  visible: boolean;
  onClose: () => void;
  categories: ListingCategory[];
  selected: ListingCategory | null;
  loading: boolean;
  error: string | null;
  onSelect: (c: ListingCategory | null) => void;
  onRetry: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} title="Categories" visible={visible}>
      <YStack gap="$x3" paddingBottom="$x2">
        {error ? (
          <ErrorState
            body={error}
            compact
            onRetry={onRetry}
            retryLabel="Retry"
            title="Could not load categories"
          />
        ) : loading ? (
          <LoadingState label="Loading categories…" />
        ) : categories.length === 0 ? (
          <EmptyState body="No categories are set up yet." compact title="No categories" />
        ) : (
          <XStack aria-label="Category" flexWrap="wrap" gap="$x2" role="radiogroup">
            <Chip label="All categories" onPress={() => onSelect(null)} selected={!selected} />
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                onPress={() => onSelect(c)}
                selected={selected?.id === c.id}
              />
            ))}
          </XStack>
        )}
      </YStack>
    </BottomSheet>
  );
}

function SavedListingsView() {
  const router = useRouter();
  const columns = useGridColumns();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const { isSaved, toggle } = useListingSave();
  const [pulling, setPulling] = useState(false);

  const savedQuery = useQuery({
    queryKey: ['marketplace', 'saved'],
    queryFn: getSavedListings,
    enabled: signedIn,
  });
  // Hide a listing as soon as its heart is turned off; the refetch then confirms it.
  const listings = (savedQuery.data ?? []).filter((l) => isSaved(l));

  const refresh = async () => {
    setPulling(true);
    try {
      await savedQuery.refetch();
    } finally {
      setPulling(false);
    }
  };

  return (
    <Screen onRefresh={refresh} refreshing={pulling}>
      <YStack gap="$x4">
        <XStack alignItems="center" gap="$x2">
          <BackButton fallback="/marketplace" />
          <YStack flex={1}>
            <AppText role="heading" variant="h2">
              Saved items
            </AppText>
            <AppText tone="muted" variant="caption">
              Listings you saved with the heart
            </AppText>
          </YStack>
        </XStack>

        {!signedIn || savedQuery.isLoading ? (
          <LoadingState count={3} label="Loading saved items…" variant="skeleton" />
        ) : savedQuery.isError ? (
          <ErrorState
            body={errorMessage(savedQuery.error)}
            onRetry={() => savedQuery.refetch()}
            retryLabel="Retry"
            title="Could not load saved items"
          />
        ) : listings.length === 0 ? (
          <EmptyState
            actionLabel="Browse marketplace"
            body="Tap the heart on any listing to keep it here so you can find it again."
            iconName="heart"
            onAction={() => router.push('/marketplace' as Href)}
            title="No saved items yet"
          />
        ) : (
          <ResponsiveGrid columns={columns} gap={12}>
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onPress={() => router.push(`/marketplace/${item.id}` as Href)}
                onToggleSave={() => toggle(item)}
                saved={isSaved(item)}
              />
            ))}
          </ResponsiveGrid>
        )}
      </YStack>
    </Screen>
  );
}
