/** Accent tones every module can pick for its tile; each maps to a design-system sub-theme. */
export type ModuleTone = 'primary' | 'teal' | 'warm' | 'danger';

/**
 * What a business module tells the app shell about itself. Every client surface (phone, web, TV, a future car or
 * watch app) builds its launcher from this list instead of hardcoding labels and routes.
 */
export type ModuleMeta = {
  key: string;
  label: string;
  /** One short line shown under the label in launchers. Describes the feature; never invented user data. */
  summary: string;
  route: string;
  /** An `AppIcon` name. */
  icon: string;
  tone: ModuleTone;
  /** Lower comes first in the default launcher order. */
  defaultRank: number;
  /** Surfaces this module is designed for today. */
  surfaces: readonly ClientSurface[];
};

export type ClientSurface = 'phone' | 'tablet' | 'desktop' | 'tv' | 'car' | 'watch';
