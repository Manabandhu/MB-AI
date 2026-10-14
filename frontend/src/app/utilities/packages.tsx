import { useRequireAuth } from '@/lib/authStore';
import { PackageTrackingScreen } from '@/modules/utilities/screens/PackageTrackingScreen';

export default function UtilitiesPackagesRoute() {
  useRequireAuth('/sign-in');
  return <PackageTrackingScreen />;
}
