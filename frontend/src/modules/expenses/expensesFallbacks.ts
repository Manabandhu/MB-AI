import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const expenseScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Expenses',
    title: 'Split expenses easily',
    subtitle: 'Track shared spending with friends, family, and community groups.',
    metrics: [
      { label: 'Active groups', value: '3' },
      { label: 'Pending', value: '$42' },
    ],
    items: [
      {
        id: 'weekend-trip',
        title: 'Weekend trip',
        body: '4 participants · $320 total',
        meta: 'Active',
        route: '/expenses/groups/1',
      },
      {
        id: 'groceries',
        title: 'Groceries',
        body: '2 participants · $84.50 total',
        meta: 'Active',
        route: '/expenses/groups/2',
      },
    ],
  },
  groups: {
    eyebrow: 'Expenses',
    title: 'Expense groups',
    subtitle: 'Manage your shared spending groups.',
    metrics: [
      { label: 'Groups', value: '3' },
      { label: 'Participants', value: '7' },
    ],
    items: [
      {
        id: 'group-1',
        title: 'Weekend trip',
        body: '4 participants · $320 total',
        route: '/expenses/groups/1',
      },
      {
        id: 'group-2',
        title: 'Groceries',
        body: '2 participants · $84.50 total',
        route: '/expenses/groups/2',
      },
    ],
  },
  balances: {
    eyebrow: 'Expenses',
    title: 'Balances',
    subtitle: 'See who owes what across all groups.',
    metrics: [
      { label: 'You owe', value: '$24.50' },
      { label: 'Owed to you', value: '$12.00' },
    ],
    items: [
      {
        id: 'balance-1',
        title: 'Alex',
        body: 'You owe Alex for the weekend trip',
        meta: '$24.50',
      },
      {
        id: 'balance-2',
        title: 'Sam',
        body: 'Sam owes you for groceries',
        meta: '$12.00',
      },
    ],
  },
  settlements: {
    eyebrow: 'Expenses',
    title: 'Settlements',
    subtitle: 'Process pending payments and confirm settlements.',
    metrics: [
      { label: 'Pending', value: '2' },
      { label: 'Completed', value: '18' },
    ],
    items: [
      {
        id: 'settlement-1',
        title: 'Pay Alex',
        body: 'Weekend trip balance',
        meta: '$24.50',
      },
      {
        id: 'settlement-2',
        title: 'Request from Sam',
        body: 'Groceries balance',
        meta: '$12.00',
      },
    ],
  },
  add: {
    eyebrow: 'Expenses',
    title: 'Add expense',
    subtitle: 'Record a new shared expense with details.',
    metrics: [
      { label: 'Steps', value: '3' },
      { label: 'Required', value: 'Title, amount, category' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Title, amount, date, and category for the expense.',
        meta: 'Step 1',
      },
      {
        id: 'split',
        title: 'Split details',
        body: 'Choose who paid and how to split the expense.',
        meta: 'Step 2',
      },
    ],
  },
};
