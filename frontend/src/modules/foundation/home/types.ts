import type { ComponentType } from 'react';

/** A card on Home owned by a business module. Home only arranges widgets; it never fetches module data itself. */
export type HomeWidget = {
  id: string;
  Component: ComponentType;
  /** Columns to span on wide layouts (2 = full row on a 2-column tablet grid). */
  span?: 1 | 2;
};
