import { apiFetch, parseJson } from '@/lib/apiClient';

export type AutomationOperation = {
  id: string;
  label: string;
  description: string;
  category: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
  configured: boolean;
};

export type AutomationExecution = {
  executionId: string;
  operationId: string;
  status: string;
  environment: string;
  ref: string;
  requestedAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminReport = {
  id: string;
  type: string;
  targetId: string;
  targetType: string;
  reporterName: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type AdminRoom = {
  id: string;
  title: string;
  hostName: string;
  status: string;
  reported: boolean;
  createdAt: string;
};

export type AdminRide = {
  id: string;
  from: string;
  to: string;
  driverId: string;
  driverName?: string;
  status: string;
  reported: boolean;
  createdAt: string;
};

export type AdminCommunityPost = {
  id: string;
  communityName: string;
  authorName: string;
  title: string;
  status: string;
  reported: boolean;
  createdAt: string;
};

export type AdminJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  reported: boolean;
  createdAt: string;
};

export type AdminEvent = {
  id: string;
  title: string;
  organizer: string;
  date: string;
  status: string;
  reported: boolean;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

export async function listAutomationOperations(): Promise<AutomationOperation[]> {
  return parseJson(await apiFetch('/api/v1/admin/automations'));
}

export async function executeAutomation(
  operationId: string,
  input: { environment: string; ref: string; reason: string; confirmed: boolean },
): Promise<AutomationExecution> {
  return parseJson(
    await apiFetch(`/api/v1/admin/automations/${encodeURIComponent(operationId)}/executions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export async function listUsers(): Promise<AdminUser[]> {
  return parseJson(await apiFetch('/api/v1/admin/users'));
}

export async function getUser(id: string): Promise<AdminUser> {
  return parseJson(await apiFetch(`/api/v1/admin/users/${encodeURIComponent(id)}`));
}

export async function updateUserStatus(input: { id: string; status: string }): Promise<AdminUser> {
  return parseJson(
    await apiFetch(`/api/v1/admin/users/${encodeURIComponent(input.id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: input.status }),
    }),
  );
}

export async function listReports(): Promise<AdminReport[]> {
  return parseJson(await apiFetch('/api/v1/admin/reports'));
}

export async function resolveReport(id: string): Promise<AdminReport> {
  return parseJson(
    await apiFetch(`/api/v1/admin/reports/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
  );
}

export async function listAdminRooms(): Promise<AdminRoom[]> {
  return parseJson(await apiFetch('/api/v1/admin/rooms'));
}

export async function listAdminRides(): Promise<AdminRide[]> {
  return parseJson(await apiFetch('/api/v1/admin/rides'));
}

export async function listAdminCommunityPosts(): Promise<AdminCommunityPost[]> {
  return parseJson(await apiFetch('/api/v1/admin/community'));
}

export async function listAdminJobs(): Promise<AdminJob[]> {
  return parseJson(await apiFetch('/api/v1/admin/jobs'));
}

export async function listAdminEvents(): Promise<AdminEvent[]> {
  return parseJson(await apiFetch('/api/v1/admin/events'));
}

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  return parseJson(await apiFetch('/api/v1/admin/audit-log'));
}
