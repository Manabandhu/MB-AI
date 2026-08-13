import { color as colors, radius, space } from '@manabandhu/design-system';
import { Pressable, StyleSheet, Text } from 'react-native';

type PillButtonVariant = 'primary' | 'secondary' | 'text';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  variant?: PillButtonVariant;
};

export function PillButton({ label, onPress, variant = 'primary' }: PillButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'text' && styles.textButton,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant !== 'primary' && styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: space.x4,
  },
  primaryButton: { backgroundColor: colors.primary, minHeight: 56 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primarySoft,
    borderWidth: 1,
  },
  textButton: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.82 },
  label: { fontSize: 15, fontWeight: '800' },
  primaryLabel: { color: colors.surface },
  secondaryLabel: { color: colors.primary },
});
