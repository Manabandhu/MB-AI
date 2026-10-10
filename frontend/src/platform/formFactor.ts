import { Platform } from 'react-native';
import { useAdaptiveLayout, type WindowClass } from './adaptive';

/**
 * The surface the app is rendering on. Layout still branches on window class; form factor only picks interaction
 * chrome (navigation style, focus rings, hover). `car` and `watch` are reserved: those targets reuse
 * `@manabandhu/core` and `@manabandhu/design-system` tokens from native companions (ADR 0007), never this UI.
 */
export type FormFactor = 'phone' | 'tablet' | 'desktop' | 'tv' | 'car' | 'watch';
export type InputMode = 'touch' | 'pointer' | 'remote';

/** Navigation chrome per window class: bottom tabs on phones, a rail on tablets, a top bar on desktop. */
export type NavigationStyle = 'bottom' | 'rail' | 'top';

function detectPointer(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(pointer: fine)').matches;
  } catch {
    return false;
  }
}

export function formFactorFor(
  windowClass: WindowClass,
  isTV: boolean,
  pointer: boolean,
): FormFactor {
  if (isTV) return 'tv';
  if (windowClass === 'compact') return 'phone';
  if (windowClass === 'medium') return 'tablet';
  return pointer || Platform.OS === 'web' ? 'desktop' : 'tablet';
}

export function navigationStyleFor(
  windowClass: WindowClass,
  formFactor: FormFactor,
): NavigationStyle {
  if (formFactor === 'tv') return 'top';
  if (windowClass === 'compact') return 'bottom';
  if (windowClass === 'medium') return 'rail';
  return formFactor === 'desktop' ? 'top' : 'rail';
}

export function useFormFactor() {
  const layout = useAdaptiveLayout();
  const isTV = Platform.isTV === true;
  const pointer = detectPointer();
  const formFactor = formFactorFor(layout.windowClass, isTV, pointer);
  const inputMode: InputMode = isTV ? 'remote' : pointer ? 'pointer' : 'touch';
  return {
    ...layout,
    formFactor,
    inputMode,
    navigationStyle: navigationStyleFor(layout.windowClass, formFactor),
  } as const;
}
