import { color as colors, space } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type SwipeActionProps = {
  leftAction?: { label: string; color: string; onPress: () => void };
  rightAction?: { label: string; color: string; onPress: () => void };
  children: React.ReactNode;
};

export function SwipeAction({ leftAction, rightAction, children }: SwipeActionProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {leftAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={leftAction.label}
          onPress={leftAction.onPress}
          style={[styles.action, { backgroundColor: leftAction.color }]}
        >
          <Text style={styles.actionText}>{leftAction.label}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.content}>{children}</View>
      {rightAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={rightAction.label}
          onPress={rightAction.onPress}
          style={[styles.action, { backgroundColor: rightAction.color }]}
        >
          <Text style={styles.actionText}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rootDark: {},
  content: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.x5,
    minWidth: 80,
  },
  actionText: { color: colors.surface, fontSize: 13, fontWeight: '700' },
});
