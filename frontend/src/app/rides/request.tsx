import { type Href, Redirect, useLocalSearchParams } from 'expo-router';

// "Find a ride" is the search screen itself; keep this route so older links (and their from/to) still work.
export default function RidesRequestRoute() {
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const query = new URLSearchParams();
  if (typeof from === 'string' && from) query.set('from', from);
  if (typeof to === 'string' && to) query.set('to', to);
  const suffix = query.toString();
  return <Redirect href={(suffix ? `/rides/search?${suffix}` : '/rides/search') as Href} />;
}
