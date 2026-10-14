import { Redirect } from 'expo-router';

// Sign-in options now live on one screen; keep this route so older links still work.
export default function ChooseLoginMethodRoute() {
  return <Redirect href="/sign-in" />;
}
