import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type TabBarItem = {
  label: string;
  route?: string;
  onPress?: () => void;
};

export type TabBarProps = {
  tabs: readonly TabBarItem[];
  activeRoute?: string;
};

export function TabBar({ tabs, activeRoute }: TabBarProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      {tabs.map((tab) => {
        const isActive = tab.route ? tab.route === activeRoute : false;
        return (
          <TouchableOpacity
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={styles.tab}
            onPress={() => tab.onPress?.()}
          >
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                colorScheme === 'dark' && styles.labelDark,
                isActive && colorScheme === 'dark' && styles.labelActiveDark,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: space.x2,
  },
  containerDark: { borderTopColor: colors.border },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.x2,
    gap: space.x1,
    minHeight: 48,
    justifyContent: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  labelDark: { color: colors.muted },
  labelActive: { color: colors.primary },
  labelActiveDark: { color: colors.primary },
});
