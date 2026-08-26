import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export type ModalProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
};

export function Modal({
  visible,
  onDismiss,
  title,
  children,
  primaryAction,
  secondaryAction,
}: ModalProps) {
  const colorScheme = useColorScheme();

  return (
    <RNModal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="fade"
      transparent
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
        />
        <View
          style={[
            styles.container,
            {
              backgroundColor: colorScheme === 'dark' ? colors.surface : colors.surface,
            },
          ]}
        >
          {title ? (
            <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>{title}</Text>
          ) : null}
          <View style={styles.body}>{children}</View>
          {primaryAction || secondaryAction ? (
            <View style={styles.actions}>
              {secondaryAction ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={secondaryAction.label}
                  onPress={secondaryAction.onPress}
                  style={[
                    styles.action,
                    styles.secondaryAction,
                    colorScheme === 'dark' && styles.secondaryActionDark,
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryText,
                      colorScheme === 'dark' && styles.secondaryTextDark,
                    ]}
                  >
                    {secondaryAction.label}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {primaryAction ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={primaryAction.label}
                  onPress={primaryAction.onPress}
                  style={[
                    styles.action,
                    styles.primaryAction,
                    colorScheme === 'dark' && styles.primaryActionDark,
                  ]}
                >
                  <Text style={styles.primaryText}>{primaryAction.label}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  backdropTouch: { ...StyleSheet.absoluteFillObject },
  container: {
    borderRadius: radius.control,
    maxWidth: '90%',
    padding: space.x4,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    width: '100%',
  },
  title: {
    color: colors.ink,
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
    marginBottom: space.x4,
  },
  titleDark: { color: colors.ink },
  body: { gap: space.x4 },
  actions: { flexDirection: 'row', gap: space.x3, marginTop: space.x4 },
  action: {
    flex: 1,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  primaryAction: { backgroundColor: colors.primary },
  primaryActionDark: { backgroundColor: colors.primary },
  primaryText: { color: colors.surface, fontWeight: '700' },
  secondaryAction: { backgroundColor: colors.primarySoft },
  secondaryActionDark: { backgroundColor: colors.primarySoft },
  secondaryText: { color: colors.primary, fontWeight: '700' },
  secondaryTextDark: { color: colors.primary },
});
