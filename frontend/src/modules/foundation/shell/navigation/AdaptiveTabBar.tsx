import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { NavigationStyle } from '@/platform/formFactor';
import { BottomTabBar } from './BottomTabBar';
import { NavRail } from './NavRail';
import { TopNav } from './TopNav';

export function AdaptiveTabBar({
  style,
  ...props
}: BottomTabBarProps & { style: NavigationStyle }) {
  if (style === 'top') return <TopNav {...props} />;
  if (style === 'rail') return <NavRail {...props} />;
  return <BottomTabBar {...props} />;
}
