import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';
import { SidebarShell } from './SidebarShell';
import { TabBadge } from './TabBadge';
import { primaryTabs } from './tabs';
import { useTabLabels } from './useChatUnread';
import { useTabPress } from './useTabPress';

export function DesktopSidebar(props: BottomTabBarProps) {
  const { palette } = useAppearance();
  const press = useTabPress(props);
  const labels = useTabLabels();
  const active = props.state.routes[props.state.index]?.name;
  return (
    <SidebarShell>
      <YStack role="tablist" gap="$x2">
        {primaryTabs.map((tab) => {
          const selected = tab.name === active;
          const { label, count, a11yLabel } = labels(tab.name);
          return (
            <XStack
              key={tab.name}
              role="tab"
              aria-label={a11yLabel}
              aria-selected={selected}
              alignItems="center"
              gap="$x3"
              minHeight={48}
              paddingHorizontal="$x3"
              backgroundColor={selected ? '$primary' : 'transparent'}
              borderRadius="$control"
              cursor="pointer"
              onPress={() => press(tab.name)}
              {...keyboardPress(() => press(tab.name))}
              focusVisibleStyle={{
                outlineWidth: 3,
                outlineStyle: 'solid',
                outlineColor: '$outlineColor',
              }}
            >
              <AppIcon
                name={tab.icon}
                color={selected ? palette.onPrimary : palette.muted}
                size={20}
              />
              <AppText color={selected ? '$onPrimary' : '$color'} variant="label" flex={1}>
                {label}
              </AppText>
              <TabBadge count={count} placement="inline" />
            </XStack>
          );
        })}
      </YStack>
    </SidebarShell>
  );
}
