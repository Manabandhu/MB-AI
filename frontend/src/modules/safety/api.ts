import { apiFetch, parseJsonOrThrow } from '@/lib/api';

// Types mirror the backend entities serialized by SafetyController (SafetyReport, BlockedUser, TrustedContact).
// There is no sample or fallback data: callers surface errors and render empty states for empty lists.

export async function getReports(): Promise<ReportItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/reports'), 'Reports');
}

export async function getBlockedUsers(): Promise<BlockedUserItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/blocked-users'), 'Blocked users');
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  const response = await apiFetch(
    `/api/v1/safety/blocked-users/${encodeURIComponent(blockedUserId)}/unblock`,
    { method: 'POST' },
  );
  if (!response.ok) {
    throw new Error(`Unblock user failed (${response.status})`);
  }
}

export async function getTrustedContacts(): Promise<TrustedContactItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/safety/trusted-contacts'), 'Trusted contacts');
}

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Files a safety report about a member, conversation, or listing (`POST /api/v1/safety/reports`). `targetId` must be
 * the target's id (a UUID); `category` says what kind of target it is and why, e.g. `user:harassment`.
 */
export async function createReport(input: {
  targetId: string;
  category: string;
  description: string;
  severity: ReportSeverity;
}): Promise<ReportItem> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/safety/reports', { method: 'POST', body: JSON.stringify(input) }),
    'File report',
  );
}

/** Adds a trusted contact (`POST /api/v1/safety/trusted-contacts`). There is no edit or delete endpoint yet. */
export async function createTrustedContact(input: {
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
}): Promise<TrustedContactItem> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/safety/trusted-contacts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Add trusted contact',
  );
}

type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

/** Statuses that still need attention; matches the backend's open-report count. */
const OPEN_REPORT_STATUSES: readonly ReportStatus[] = ['OPEN', 'IN_REVIEW'];

export function isOpenReport(report: Pick<ReportItem, 'status'>): boolean {
  return OPEN_REPORT_STATUSES.includes(String(report.status).toUpperCase() as ReportStatus);
}

export type ReportItem = {
  id: string;
  reporterId: string;
  targetId: string;
  category: string;
  description: string;
  status: ReportStatus;
  severity: ReportSeverity;
  evidenceUrls?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
};

export type BlockedUserItem = {
  id: string;
  ownerId: string;
  blockedUserId: string;
  reason?: string | null;
  createdAt: string;
};

export type TrustedContactItem = {
  id: string;
  ownerId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  relationship?: string | null;
  createdAt: string;
};
