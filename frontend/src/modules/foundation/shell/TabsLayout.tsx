import { Tabs } from 'expo-router/js-tabs';
import { useRequireAuth } from '@/lib/authStore';
import { useFormFactor } from '@/platform/formFactor';
import { useAppearance } from '@/theme/ThemeProvider';
import { AdaptiveTabBar } from './navigation/AdaptiveTabBar';
import { primaryTabs } from './navigation/tabs';

/**
 * Signed-in app frame. One navigator for every device: the tab bar moves to the bottom (phone), a side rail
 * (tablet, foldable), or a top bar (desktop) by window class, while each tab keeps its state when switching.
 */
export function TabsLayout() {
  useRequireAuth('/sign-in');
  const { navigationStyle } = useFormFactor();
  const { palette } = useAppearance();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition:
          navigationStyle === 'top' ? 'top' : navigationStyle === 'rail' ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: palette.background },
        lazy: true,
      }}
      tabBar={(props) => <AdaptiveTabBar {...props} style={navigationStyle} />}
    >
      {primaryTabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
