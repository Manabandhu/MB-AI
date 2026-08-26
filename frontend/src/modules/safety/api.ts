import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getSafetyCenter(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/safety/center');
  if (!response.ok) throw new Error(`Safety center failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getReports() {
  const response = await apiFetch('/api/v1/safety/reports');
  if (!response.ok) throw new Error(`Reports failed: ${response.status}`);
  return response.json() as Promise<ReportItem[]>;
}

export async function getBlockedUsers() {
  const response = await apiFetch('/api/v1/safety/blocked-users');
  if (!response.ok) throw new Error(`Blocked users failed: ${response.status}`);
  return response.json() as Promise<BlockedUserItem[]>;
}

export async function getTrustedContacts() {
  const response = await apiFetch('/api/v1/safety/trusted-contacts');
  if (!response.ok) throw new Error(`Trusted contacts failed: ${response.status}`);
  return response.json() as Promise<TrustedContactItem[]>;
}

export type ReportItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  status: 'open' | 'reviewing' | 'resolved';
};

export type BlockedUserItem = {
  id: string;
  name: string;
  initials: string;
  reason: string;
  blockedAt: string;
};

export type TrustedContactItem = {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  addedAt: string;
};
