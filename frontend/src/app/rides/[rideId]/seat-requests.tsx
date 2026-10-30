import { type Href, Redirect, useLocalSearchParams } from 'expo-router';

// Seat requests are a tab of the Manage hub now; keep this route so notifications and older links still work.
export default function RideSeatRequestsRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <Redirect href={`/rides/${rideId}/manage?tab=requests` as Href} />;
}
