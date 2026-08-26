import { useQuery } from '@tanstack/react-query';
import { getSafetyCenter } from '@/modules/safety/api';
import { safetyCenterFallback } from '@/modules/safety/safetyFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

export function SafetyCenterScreen() {
  const center = useQuery({ queryKey: ['safety', 'center'], queryFn: getSafetyCenter });
  const data = center.data ?? safetyCenterFallback;

  return (
    <FeatureScreen
      actions={[
        { label: 'Reports', route: '/safety/reports' },
        { label: 'Blocked users', route: '/safety/blocked-users' },
        { label: 'Trusted contacts', route: '/safety/trusted-contacts' },
      ]}
      cards={data.items}
      currentRoute="/safety"
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
