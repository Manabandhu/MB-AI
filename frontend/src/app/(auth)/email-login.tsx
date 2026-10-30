import { Redirect } from 'expo-router';

// Email sign-in is part of the main sign-in screen; keep this route so older links still work.
export default function EmailLoginRoute() {
  return <Redirect href="/sign-in" />;
}
