import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getSafetyCenter(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/center'), 'Safety center');
}

export async function getReports(): Promise<ReportItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/reports'), 'Reports');
}

export async function getBlockedUsers(): Promise<BlockedUserItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/blocked-users'), 'Blocked users');
}

export async function getTrustedContacts(): Promise<TrustedContactItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/trusted-contacts'), 'Trusted contacts');
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
