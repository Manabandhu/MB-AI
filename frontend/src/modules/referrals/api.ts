import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';

export type Referral = {
  id: string;
  /** Absent (`null`) on the public list, which never exposes user ids. */
  ownerId?: string | null;
  recipientId?: string | null;
  type: 'request' | 'offer';
  /** Stored lowercase (`pending`, `open`, `active`, `closed`); compare case-insensitively. */
  status: string;
  title: string;
  description?: string | null;
  category?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getReferralDetail(referralId: string): Promise<Referral> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/referrals/${encodeURIComponent(referralId)}`),
    'Referral',
  );
}

export async function createReferralRequest(input: {
  title: string;
  description: string;
  category: string;
  details?: string;
  urgency: 'low' | 'medium' | 'high';
  desiredOutcome?: string;
}): Promise<Referral> {
  return parseJson(
    await apiFetch('/api/v1/referrals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
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
  return parseJson(
    await apiFetch('/api/v1/referrals/offer', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export type ReferralOfferDetails = {
  id: string;
  referralId: string;
  serviceType: string;
  availability?: string;
  terms?: string;
  expiresAt?: string;
  createdAt: string;
};

export type ReferralRequestDetails = {
  id: string;
  referralId: string;
  category: string;
  details?: string;
  urgency: 'low' | 'medium' | 'high';
  desiredOutcome?: string;
  createdAt: string;
};

export async function listPublicReferrals(): Promise<Referral[]> {
  return parseJson(await apiFetch('/api/v1/referrals/public'));
}

/** Missing details are `null` (404); any other failure throws so the screen can show it. */
async function optionalDetails<T>(path: string): Promise<T | null> {
  const response = await apiFetch(path);
  if (response.status === 404) return null;
  return parseJson<T>(response);
}

export async function getReferralOffer(referralId: string): Promise<ReferralOfferDetails | null> {
  return optionalDetails(`/api/v1/referrals/${encodeURIComponent(referralId)}/offer`);
}

export async function getReferralRequest(
  referralId: string,
): Promise<ReferralRequestDetails | null> {
  return optionalDetails(`/api/v1/referrals/${encodeURIComponent(referralId)}/request`);
}

/** Owner only: close (`closed`) or reopen (`open`) a referral. */
export async function updateReferralStatus(
  referralId: string,
  status: 'open' | 'closed',
): Promise<Referral> {
  return parseJson(
    await apiFetch(`/api/v1/referrals/${encodeURIComponent(referralId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  );
}

export async function getMyReferrals(): Promise<Referral[]> {
  return parseJson(await apiFetch('/api/v1/referrals'));
}

/**
 * Messages the poster of an open referral in one server transaction (reuses your direct chat with them, or opens
 * one) and returns the conversation to open (`POST /api/v1/referrals/{id}/contact`).
 */
export async function contactReferral(
  referralId: string,
  message: string,
): Promise<{ conversationId: string }> {
  return parseJson(
    await apiFetch(`/api/v1/referrals/${encodeURIComponent(referralId)}/contact`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  );
}
