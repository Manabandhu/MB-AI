import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getUtilitiesHome(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/utilities/home');
  if (!response.ok) throw new Error(`Utilities home failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getPackages() {
  const response = await apiFetch('/api/v1/utilities/packages');
  if (!response.ok) throw new Error(`Packages failed: ${response.status}`);
  return response.json() as Promise<PackageItem[]>;
}

export async function getNearby() {
  const response = await apiFetch('/api/v1/utilities/nearby');
  if (!response.ok) throw new Error(`Nearby failed: ${response.status}`);
  return response.json() as Promise<NearbyItem[]>;
}

export async function getEmergencyResources() {
  const response = await apiFetch('/api/v1/utilities/emergency');
  if (!response.ok) throw new Error(`Emergency resources failed: ${response.status}`);
  return response.json() as Promise<EmergencyItem[]>;
}

export type PackageItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  status: string;
};

export type NearbyItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  distance: string;
};

export type EmergencyItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  actionLabel: string;
};
