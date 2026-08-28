import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getUtilitiesHome(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/home'), 'Utilities home');
}

export async function getPackages(): Promise<PackageItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/packages'), 'Packages');
}

export async function getNearby(): Promise<NearbyItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/nearby'), 'Nearby');
}

export async function getEmergencyResources(): Promise<EmergencyItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/emergency'), 'Emergency resources');
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
