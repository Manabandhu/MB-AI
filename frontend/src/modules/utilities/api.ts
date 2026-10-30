import type { CatalogScreenContent } from '@manabandhu/core';
import { apiFetch, parseJsonOrThrow } from '@/lib/api';

// Types mirror the backend entities serialized by UtilitiesController (PackageTracking, NearbyPlace,
// EmergencyResource). Errors propagate so screens show an error state, never sample data.

export async function getUtilitiesHome(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/home'), 'Utilities home');
}

export async function getPackages(): Promise<PackageItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/packages'), 'Packages');
}

/** Starts tracking a package (`POST /api/v1/utilities/packages`). `status` is one of `PACKAGE_STATUSES`. */
export async function createPackage(input: {
  trackingNumber: string;
  carrier: string;
  status: PackageStatus;
  estimatedDelivery?: string | null;
}): Promise<PackageItem> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/utilities/packages', { method: 'POST', body: JSON.stringify(input) }),
    'Add package',
  );
}

export async function getNearby(): Promise<NearbyItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/nearby'), 'Nearby');
}

export async function getEmergencyResources(): Promise<EmergencyItem[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/utilities/emergency'), 'Emergency resources');
}

export type PackageStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION';

export type PackageItem = {
  id: string;
  ownerId: string;
  trackingNumber: string;
  carrier: string;
  status: PackageStatus | string;
  estimatedDelivery?: string | null;
  lastUpdate: string;
  createdAt: string;
};

export type NearbyItem = {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  distanceKm?: number | null;
  phone?: string | null;
};

export type EmergencyItem = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string | null;
  hours?: string | null;
  description: string;
  latitude: number;
  longitude: number;
};
