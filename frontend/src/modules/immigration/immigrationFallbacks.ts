import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const immigrationScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Immigration',
    title: 'Immigration resources',
    subtitle: 'Guides, checklists, and community support for immigration journeys.',
    metrics: [
      { label: 'Resources', value: '48' },
      { label: 'Guides', value: '12' },
    ],
    items: [
      {
        id: 'opt-guide',
        title: 'OPT guide',
        body: 'Step-by-step optional practical training guide.',
        meta: 'Popular',
        route: '/immigration/resources/1',
      },
      {
        id: 'visa-checklist',
        title: 'Visa checklist',
        body: 'Documents needed for F1 and H1B applications.',
        meta: 'Checklist',
        route: '/immigration/resources/2',
      },
    ],
  },
  resources: {
    eyebrow: 'Immigration',
    title: 'Resources',
    subtitle: 'Browse immigration resources and reference materials.',
    metrics: [
      { label: 'Resources', value: '48' },
      { label: 'Updated', value: 'This week' },
    ],
    items: [
      {
        id: 'resource-1',
        title: 'Visa basics',
        body: 'Overview of common visa categories.',
        meta: 'Guide',
        route: '/immigration/resources/1',
      },
      {
        id: 'resource-2',
        title: 'Work authorization',
        body: 'OPT, CPT, H1B, and green card basics.',
        meta: 'Guide',
        route: '/immigration/resources/2',
      },
    ],
  },
  guides: {
    eyebrow: 'Immigration',
    title: 'Guides',
    subtitle: 'Step-by-step guides for common immigration processes.',
    metrics: [
      { label: 'Guides', value: '12' },
      { label: 'Steps', value: '4 avg' },
    ],
    items: [
      {
        id: 'guide-1',
        title: 'F1 to OPT',
        body: 'Timeline and required documents.',
        route: '/immigration/resources/1',
      },
      {
        id: 'guide-2',
        title: 'Green card renewal',
        body: 'How to renew your permanent resident card.',
        route: '/immigration/resources/2',
      },
    ],
  },
  checklists: {
    eyebrow: 'Immigration',
    title: 'Checklists',
    subtitle: 'Document checklists to prepare for applications.',
    metrics: [
      { label: 'Checklists', value: '8' },
      { label: 'Documents', value: '32' },
    ],
    items: [
      {
        id: 'checklist-1',
        title: 'Passport checklist',
        body: 'Ensure your passport is valid for at least 6 months.',
        route: '/immigration/resources/1',
      },
      {
        id: 'checklist-2',
        title: 'I-20 checklist',
        body: 'Documents required for I-20 issuance.',
        route: '/immigration/resources/2',
      },
    ],
  },
  faq: {
    eyebrow: 'Immigration',
    title: 'FAQ',
    subtitle: 'Answers to common immigration questions.',
    metrics: [
      { label: 'Questions', value: '24' },
      { label: 'Answers', value: '48' },
    ],
    items: [
      {
        id: 'faq-1',
        title: 'How do I apply for OPT?',
        body: 'Apply through your university DSO 90 days before your program end date.',
        route: '/immigration/resources/1',
      },
      {
        id: 'faq-2',
        title: 'What is the H1B lottery?',
        body: 'Annual selection process for H1B visa holders.',
        route: '/immigration/resources/2',
      },
    ],
  },
  questions: {
    eyebrow: 'Immigration',
    title: 'Questions',
    subtitle: 'Community Q&A about immigration topics.',
    metrics: [
      { label: 'Questions', value: '56' },
      { label: 'Answers', value: '120' },
    ],
    items: [
      {
        id: 'q-1',
        title: 'Can I travel while on OPT?',
        body: 'Answers from community members.',
        meta: '3 answers',
        route: '/immigration/resources/1',
      },
      {
        id: 'q-2',
        title: 'How to update address with USCIS?',
        body: 'Steps for AR-11 submission.',
        meta: '5 answers',
        route: '/immigration/resources/2',
      },
    ],
  },
  uscis: {
    eyebrow: 'Immigration',
    title: 'USCIS alerts',
    subtitle: 'Latest updates and policy changes from USCIS.',
    metrics: [
      { label: 'Alerts', value: '6' },
      { label: 'Updates', value: 'This month' },
    ],
    items: [
      {
        id: 'uscis-1',
        title: 'Fee increase notice',
        body: 'New fees effective October 2024.',
        meta: 'Alert',
        route: '/immigration/resources/1',
      },
      {
        id: 'uscis-2',
        title: 'Policy manual update',
        body: 'Changes to employment authorization policies.',
        meta: 'Update',
        route: '/immigration/resources/2',
      },
    ],
  },
  news: {
    eyebrow: 'Immigration',
    title: 'News',
    subtitle: 'Immigration policy news and analysis.',
    metrics: [
      { label: 'Articles', value: '15' },
      { label: 'Sources', value: '4' },
    ],
    items: [
      {
        id: 'news-1',
        title: 'New visa bulletin released',
        body: 'Priority dates updated for EB categories.',
        meta: 'This week',
        route: '/immigration/resources/1',
      },
      {
        id: 'news-2',
        title: 'OPT cap reached',
        body: 'Regular cap reached for FY2026.',
        meta: 'Policy',
        route: '/immigration/resources/2',
      },
    ],
  },
  saved: {
    eyebrow: 'Immigration',
    title: 'Saved resources',
    subtitle: 'Your bookmarked immigration resources.',
    metrics: [
      { label: 'Saved', value: '7' },
      { label: 'Folders', value: '2' },
    ],
    items: [
      {
        id: 'saved-1',
        title: 'OPT timeline',
        body: 'Step-by-step OPT application timeline.',
        meta: 'Saved',
        route: '/immigration/resources/1',
      },
      {
        id: 'saved-2',
        title: 'Visa categories',
        body: 'Overview of visa categories.',
        meta: 'Saved',
        route: '/immigration/resources/2',
      },
    ],
  },
};
