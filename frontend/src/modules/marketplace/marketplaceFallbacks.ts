import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const marketplaceScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Marketplace',
    title: 'Buy and sell locally',
    subtitle: 'Discover items from your community with trusted sellers.',
    metrics: [
      { label: 'Listings', value: '34' },
      { label: 'Categories', value: '8' },
    ],
    items: [
      {
        id: 'listing-1',
        title: 'Vintage camera',
        body: 'Good condition · pickup in Irving',
        meta: '$120',
        route: '/marketplace/1',
      },
      {
        id: 'listing-2',
        title: 'Wooden desk',
        body: 'Solid wood · assembly included',
        meta: '$80',
        route: '/marketplace/2',
      },
    ],
  },
  search: {
    eyebrow: 'Marketplace',
    title: 'Search listings',
    subtitle: 'Find items by category, price, and location.',
    metrics: [
      { label: 'Results', value: '18' },
      { label: 'Filters', value: '5' },
    ],
    items: [
      {
        id: 'search-1',
        title: 'Vintage camera',
        body: 'Good condition · pickup in Irving',
        meta: '$120',
        route: '/marketplace/1',
      },
      {
        id: 'search-2',
        title: 'Wooden desk',
        body: 'Solid wood · assembly included',
        meta: '$80',
        route: '/marketplace/2',
      },
    ],
  },
  categories: {
    eyebrow: 'Marketplace',
    title: 'Categories',
    subtitle: 'Browse items by category.',
    metrics: [
      { label: 'Categories', value: '8' },
      { label: 'Listings', value: '34' },
    ],
    items: [
      {
        id: 'cat-1',
        title: 'Electronics',
        body: 'Cameras, phones, laptops, and accessories.',
        route: '/marketplace/search',
      },
      {
        id: 'cat-2',
        title: 'Furniture',
        body: 'Tables, chairs, shelves, and decor.',
        route: '/marketplace/search',
      },
    ],
  },
  saved: {
    eyebrow: 'Marketplace',
    title: 'Saved items',
    subtitle: 'Your bookmarked marketplace listings.',
    metrics: [
      { label: 'Saved', value: '4' },
      { label: 'Price drops', value: '1' },
    ],
    items: [
      {
        id: 'saved-1',
        title: 'Vintage camera',
        body: 'Good condition · pickup in Irving',
        meta: '$120',
        route: '/marketplace/1',
      },
    ],
  },
  sell: {
    eyebrow: 'Marketplace',
    title: 'Sell an item',
    subtitle: 'Create a new listing in minutes.',
    metrics: [
      { label: 'Steps', value: '4' },
      { label: 'Required', value: 'Title, price, photos' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Title, category, price, and condition.',
        meta: 'Step 1',
      },
      {
        id: 'photos',
        title: 'Photos',
        body: 'Upload clear photos from multiple angles.',
        meta: 'Step 2',
      },
    ],
  },
};
