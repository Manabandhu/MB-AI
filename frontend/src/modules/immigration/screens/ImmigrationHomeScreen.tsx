import { useQuery } from '@tanstack/react-query';
import { getImmigrationScreen } from '@/modules/immigration/api';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ErrorState } from '@/modules/shared/components/ErrorState';

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

type ImmigrationScreenProps = {
  screenId: keyof typeof immigrationRoutes;
};

const DEFAULT_IMMIGRATION_DATA: Record<string, CatalogScreenContent> = {
  home: {
    title: 'Immigration & Visa Guide',
    subtitle: 'Community-verified knowledge base for F-1 OPT/CPT, H-1B, and permanent residency.',
    eyebrow: 'Legal & Immigration',
    metrics: [
      { label: 'Guides', value: '18' },
      { label: 'Checklists', value: '6' },
      { label: 'Community Attorneys', value: '4' },
    ],
    items: [
      { id: 'opt-cpt', title: 'F-1 OPT & STEM Extension', body: 'Step-by-step checklist, 90-day unemployment rules, and SEVP reporting.', meta: 'Student Visa', route: '/immigration/checklists' },
      { id: 'h1b-lottery', title: 'H-1B Cap & Change of Status', body: 'Timelines, LCA filing requirements, and employer transition guidance.', meta: 'Work Visa', route: '/immigration/guides' },
      { id: 'uscis-tracking', title: 'USCIS Processing Times & News', body: 'Texas Service Center average wait times and policy memos.', meta: 'Updates', route: '/immigration/uscis' },
    ],
  },
  resources: {
    title: 'Immigration Resources',
    subtitle: 'Official government portals, legal aid directories, and community tips.',
    eyebrow: 'Resources',
    metrics: [{ label: 'Verified links', value: '24' }],
    items: [
      { id: 'uscis-portal', title: 'USCIS Case Status Online', body: 'Direct access to check receipt notices and approval updates.', meta: 'Official Portal', route: '/immigration/uscis' },
      { id: 'dol-prevailing', title: 'DOL Prevailing Wage Tracker', body: 'Standard occupational classification wage determinations for Texas.', meta: 'Labor Department', route: '/immigration/guides' },
    ],
  },
  guides: {
    title: 'Visa & Status Guides',
    subtitle: 'In-depth documentation for common visa transitions and compliance.',
    eyebrow: 'Guides',
    metrics: [{ label: 'Read time', value: '5-10 min' }],
    items: [
      { id: 'opt-guide', title: 'F-1 to H-1B Cap-Gap Explained', body: 'How work authorization continues while H-1B petition is pending.', meta: 'Cap Gap', route: '/immigration/checklists' },
      { id: 'h4-ead-guide', title: 'H-4 EAD Filing Guide', body: 'Documents, photo guidelines, and biometrics checklist.', meta: 'H-4 EAD', route: '/immigration/checklists' },
    ],
  },
  checklists: {
    title: 'Filing & Interview Checklists',
    subtitle: 'Never miss an evidence document or signature requirement.',
    eyebrow: 'Checklists',
    metrics: [{ label: 'Checklists', value: '6 active' }],
    items: [
      { id: 'opt-docs', title: 'Initial OPT Application Checklist', body: 'I-20 endorsement, I-765, passport photos, and G-1145.', meta: 'Required', route: '/immigration/resources' },
      { id: 'i485-docs', title: 'Adjustment of Status (I-485) Evidence', body: 'Birth certificate, medical exam (I-693), and tax transcripts.', meta: 'Green Card', route: '/immigration/resources' },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Answers from Telugu and Desi alumni across US universities.',
    eyebrow: 'FAQ',
    metrics: [{ label: 'Answers', value: '50+' }],
    items: [
      { id: 'travel-opt', title: 'Can I travel abroad on STEM OPT?', body: 'Travel signature validity, valid visa stamp, and job offer letter rules.', meta: 'Travel', route: '/immigration/guides' },
    ],
  },
  questions: {
    title: 'Ask Immigration Helpdesk',
    subtitle: 'Post an anonymous question to community immigration paralegals.',
    eyebrow: 'Q&A',
    metrics: [],
    items: [],
  },
  uscis: {
    title: 'USCIS Bulletin & Center Updates',
    subtitle: 'Monthly visa bulletin movements and field office processing times.',
    eyebrow: 'USCIS',
    metrics: [{ label: 'Current bulletin', value: 'EB-2 / EB-3' }],
    items: [
      { id: 'visa-bulletin', title: 'Current Visa Bulletin Tracker', body: 'Final action dates and dates for filing for India category.', meta: 'Bulletin', route: '/immigration/news' },
    ],
  },
  news: {
    title: 'Immigration News & Alerts',
    subtitle: 'Real-time policy updates affecting international professionals in the US.',
    eyebrow: 'News',
    metrics: [],
    items: [],
  },
  saved: {
    title: 'Saved Guides & Checklists',
    subtitle: 'Quick access to your bookmarked legal articles.',
    eyebrow: 'Bookmarks',
    metrics: [],
    items: [],
  },
};

export function ImmigrationScreen({ screenId }: ImmigrationScreenProps) {
  const screen = useQuery({
    queryKey: ['immigration', 'screen', screenId],
    queryFn: () => getImmigrationScreen(screenId),
    retry: false,
  });

  if (screen.isLoading) {
    return <LoadingState label="Loading immigration resources..." />;
  }

  const data = screen.data ?? DEFAULT_IMMIGRATION_DATA[screenId] ?? DEFAULT_IMMIGRATION_DATA.home;

  return (
    <FeatureScreen
      actions={immigrationActions[screenId]}
      cards={data.items}
      currentRoute={immigrationRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

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

const immigrationActions = {
  home: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Checklists', route: '/immigration/checklists' },
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Saved', route: '/immigration/saved' },
  ],
  resources: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Saved', route: '/immigration/saved' },
  ],
  guides: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Checklists', route: '/immigration/checklists' },
  ],
  checklists: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  faq: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Questions', route: '/immigration/questions' },
  ],
  questions: [
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  uscis: [
    { label: 'News', route: '/immigration/news' },
    { label: 'Guides', route: '/immigration/guides' },
  ],
  news: [
    { label: 'USCIS alerts', route: '/immigration/uscis' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  saved: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Guides', route: '/immigration/guides' },
  ],
} as const;
