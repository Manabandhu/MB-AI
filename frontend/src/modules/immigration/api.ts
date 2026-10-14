import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

/** Mirrors backend `ImmigrationGuide`. */
export type ImmigrationGuide = {
  id: string;
  ownerId?: string | null;
  title: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string | null;
  estimatedDurationMinutes?: number | null;
  createdAt: string;
};

/** Mirrors backend `ImmigrationNews`. */
export type ImmigrationNews = {
  id: string;
  title: string;
  body?: string | null;
  source?: string | null;
  url?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

/** Mirrors backend `ImmigrationResourceView` (no owner id; `mine` marks the caller's own resources). */
export type ImmigrationResource = {
  id: string;
  mine?: boolean;
  title: string;
  description?: string | null;
  category?: string | null;
  url?: string | null;
  resourceType?: 'DOCUMENT' | 'GUIDE' | 'LINK' | 'FORM' | 'TEMPLATE' | string | null;
  tags?: string | null;
  verified?: boolean;
  createdAt: string;
};

/** Mirrors backend `ImmigrationChecklist`. `itemsJson` is a JSON-encoded array. */
export type ImmigrationChecklist = {
  id: string;
  ownerId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  itemsJson?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

/** Mirrors backend `FaqItem`. */
export type ImmigrationFaqItem = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  tags?: string | null;
  published?: boolean;
  sortOrder?: number;
  createdAt: string;
};

function withCategory(path: string, category?: string): string {
  return category ? `${path}?category=${encodeURIComponent(category)}` : path;
}

export async function listImmigrationGuides(category?: string): Promise<ImmigrationGuide[]> {
  return parseJsonOrThrow(
    await apiFetch(withCategory('/api/v1/immigration/guides', category)),
    'Immigration guides',
  );
}

export async function listImmigrationNews(): Promise<ImmigrationNews[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/immigration/news'), 'Immigration news');
}

export async function listImmigrationResources(category?: string): Promise<ImmigrationResource[]> {
  return parseJsonOrThrow(
    await apiFetch(withCategory('/api/v1/immigration/resources', category)),
    'Immigration resources',
  );
}

export async function getImmigrationResource(resourceId: string): Promise<ImmigrationResource> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/immigration/resources/${encodeURIComponent(resourceId)}`),
    'Immigration resource',
  );
}

export async function listImmigrationChecklists(
  category?: string,
): Promise<ImmigrationChecklist[]> {
  return parseJsonOrThrow(
    await apiFetch(withCategory('/api/v1/immigration/checklists', category)),
    'Immigration checklists',
  );
}

export async function listImmigrationFaq(category?: string): Promise<ImmigrationFaqItem[]> {
  return parseJsonOrThrow(
    await apiFetch(withCategory('/api/v1/immigration/faq', category)),
    'Immigration FAQ',
  );
}
