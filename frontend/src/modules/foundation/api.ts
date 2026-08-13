import { apiFetch } from '@/lib/api';
import type { WelcomeFlow } from '@/modules/foundation/welcomeTypes';

export async function getWelcomeFlow(): Promise<WelcomeFlow> {
  const response = await apiFetch('/api/v1/foundation/welcome');
  if (!response.ok) throw new Error(`Welcome flow failed: ${response.status}`);
  return response.json() as Promise<WelcomeFlow>;
}
