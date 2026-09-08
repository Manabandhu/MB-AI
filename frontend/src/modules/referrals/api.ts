import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getReferralsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/referrals/screens/${screenId}`),
    'Referrals screen',
  );
}

export type Referral = {
  id: string;
  ownerId: string;
  recipientId: string;
  type: 'request' | 'offer';
  status: string;
  title: string;
  description: string;
  category?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getReferralDetail(referralId: string): Promise<Referral> {
  return parseJson(await apiFetch(`/api/v1/referrals/${encodeURIComponent(referralId)}`));
}

export async function createReferralRequest(input: {
  title: string;
  description: string;
  category?: string;
  details?: string;
  urgency: string;
  desiredOutcome?: string;
}): Promise<Referral> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/referrals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'CreateReferralRequest',
  );
}

export async function createReferralOffer(input: {
  title: string;
  description: string;
  serviceType: string;
  availability?: string;
  terms?: string;
  expiresAt?: string;
}): Promise<Referral> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/referrals/offer', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'CreateReferralOffer',
  );
}

export async function getMyReferrals(): Promise<Referral[]> {
  return parseJson(await apiFetch('/api/v1/referrals'));
}
