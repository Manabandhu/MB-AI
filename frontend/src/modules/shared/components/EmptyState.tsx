import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
};

export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>{title}</Text>
      <Text style={[styles.body, colorScheme === 'dark' && styles.bodyDark]}>{body}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={[styles.button, colorScheme === 'dark' && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, colorScheme === 'dark' && styles.buttonTextDark]}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.x4,
    padding: space.x6,
  },
  rootDark: {},
  icon: { marginBottom: space.x3 },
  title: {
    color: colors.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
    textAlign: 'center',
  },
  titleDark: { color: colors.ink },
  body: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    textAlign: 'center',
  },
  bodyDark: { color: colors.muted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: space.x6,
    paddingVertical: space.x3,
    marginTop: space.x2,
  },
  buttonDark: { backgroundColor: colors.primary },
  buttonText: {
    color: colors.surface,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  buttonTextDark: { color: colors.surface },
});
