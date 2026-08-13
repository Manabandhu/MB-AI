import { apiFetch } from '@/lib/api';

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

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await response.text();
  throw new Error(detail || `Request failed: ${response.status}`);
}

export async function listAutomationOperations(): Promise<AutomationOperation[]> {
  return responseJson(await apiFetch('/api/v1/admin/automations'));
}

export async function executeAutomation(
  operationId: string,
  input: { environment: string; ref: string; reason: string; confirmed: boolean },
): Promise<AutomationExecution> {
  return responseJson(
    await apiFetch(`/api/v1/admin/automations/${encodeURIComponent(operationId)}/executions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}
