import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform } from 'react-native';

/** Standard tab press: emit `tabPress` (so screens can scroll to top) then navigate unless prevented. */
export function useTabPress({
  state,
  navigation,
}: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
  return (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const focused = state.routes[state.index]?.name === routeName;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
}
