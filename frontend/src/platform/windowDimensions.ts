import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions as useNativeWindowDimensions } from 'react-native';

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const initialWebDimensions = { width: 390, height: 844, scale: 1, fontScale: 1 } as const;

/** Static web pages and their first client render agree; the real viewport applies immediately after hydration. */
export function useWindowDimensions() {
  const dimensions = useNativeWindowDimensions();
  const hydrated = useClientReady();
  return Platform.OS === 'web' && !hydrated ? initialWebDimensions : dimensions;
}

/** Web portals mount after hydration; native can render immediately. */
export function useClientReady() {
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return Platform.OS !== 'web' || ready;
}
