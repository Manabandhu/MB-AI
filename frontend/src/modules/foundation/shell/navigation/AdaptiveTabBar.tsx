import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { NavigationStyle } from '@/platform/formFactor';
import { BottomTabBar } from './BottomTabBar';
import { DesktopSidebar } from './DesktopSidebar';
import { NavRail } from './NavRail';

export function AdaptiveTabBar({
  style,
  ...props
}: BottomTabBarProps & { style: NavigationStyle }) {
  if (style === 'top') return <DesktopSidebar {...props} />;
  if (style === 'rail') return <NavRail {...props} />;
  return <BottomTabBar {...props} />;
}
