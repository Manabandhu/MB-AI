import type { paletteFor } from '@manabandhu/design-system';
import type React from 'react';
import type { MapMarkerItem } from '../mapTypes';

type Palette = ReturnType<typeof paletteFor>;

// HTML/CSS helpers for web map markers and controls (they render outside the React tree).

/** Lucide `map-pin` as inline SVG for HTML map markers (they live outside the React tree). */
export const PIN_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Price pill HTML shared by the Google overlay and the Leaflet divIcon, coloured from the active palette.
 * Titles and prices are escaped because they come from member listings.
 */
export function markerPillHtml(
  m: MapMarkerItem,
  isSelected: boolean,
  p: Palette,
  transform: string,
  extraCss = '',
): string {
  const price = m.price ? escapeHtml(`$${m.price}`) : PIN_SVG;
  const title = escapeHtml(m.title.length > 18 ? `${m.title.slice(0, 18)}...` : m.title);
  return `
    <div style="
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: ${isSelected ? p.primary : p.surface};
      color: ${isSelected ? p.surfaceContainerLowest : p.ink};
      border: 1.5px solid ${isSelected ? p.primary : p.border};
      border-radius: 22px;
      box-shadow: 0 4px 14px ${p.overlay};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      transform: ${transform};
      transition: transform 0.15s ease, background-color 0.15s ease;
      ${extraCss}
    ">
      <span style="display: inline-flex; color: ${isSelected ? p.surfaceContainerLowest : p.primary}; font-weight: 800;">${price}</span>
      <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${title}</span>
    </div>
  `;
}

export function zoomFromDelta(delta: number): number {
  if (!delta || delta <= 0) return 13;
  const zoom = Math.round(Math.log(360 / delta) / Math.LN2);
  return Math.min(Math.max(zoom, 3), 18);
}

/** 44px map control button (draw, redraw, clear, cancel) coloured from the active palette. */
export function controlStyle(
  p: Palette,
  tone: 'surface' | 'neutral' | 'danger',
): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '44px',
    padding: '0 16px',
    borderRadius: tone === 'neutral' ? '12px' : '22px',
    border: tone === 'surface' ? `1.5px solid ${p.border}` : 'none',
    backgroundColor:
      tone === 'danger' ? p.error : tone === 'neutral' ? p.surfaceContainerHigh : p.surface,
    color: tone === 'danger' ? p.surfaceContainerLowest : p.ink,
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: tone === 'neutral' ? 'none' : `0 2px 6px ${p.overlay}`,
  };
}
