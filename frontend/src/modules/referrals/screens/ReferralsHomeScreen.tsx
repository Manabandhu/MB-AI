import { useQuery } from '@tanstack/react-query';
import { getReferralsScreen } from '@/modules/referrals/api';
import { referralsScreenFallbacks } from '@/modules/referrals/referralsFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type ReferralsScreenProps = {
  screenId: keyof typeof referralsRoutes;
};

export function ReferralsScreen({ screenId }: ReferralsScreenProps) {
  const fallback = referralsScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['referrals', 'screen', screenId],
    queryFn: () => getReferralsScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={referralsActions[screenId]}
      cards={data.items}
      currentRoute={referralsRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const referralsRoutes = {
  home: '/referrals',
  request: '/referrals/request',
  offer: '/referrals/offer',
  'referral-details': '/referrals/1',
  mine: '/referrals/mine',
} as const;

const referralsActions = {
  home: [
    { label: 'Request referral', route: '/referrals/request' },
    { label: 'Offer referral', route: '/referrals/offer' },
    { label: 'My referrals', route: '/referrals/mine' },
  ],
  request: [
    { label: 'Offer referral', route: '/referrals/offer' },
    { label: 'Home', route: '/referrals' },
  ],
  offer: [
    { label: 'Request referral', route: '/referrals/request' },
    { label: 'Home', route: '/referrals' },
  ],
  'referral-details': [
    { label: 'Request referral', route: '/referrals/request' },
    { label: 'My referrals', route: '/referrals/mine' },
  ],
  mine: [
    { label: 'Request referral', route: '/referrals/request' },
    { label: 'Offer referral', route: '/referrals/offer' },
  ],
} as const;
