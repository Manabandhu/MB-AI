import { type Href, Redirect, useLocalSearchParams } from 'expo-router';

// Riders are a tab of the Manage hub now (members see who is on the ride on the ride page); keep this route so
// older links still work.
export default function RideParticipantsRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <Redirect href={`/rides/${rideId}/manage?tab=riders` as Href} />;
}
