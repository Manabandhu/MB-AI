import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

export type TextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  maxLength?: number;
  accessibilityLabel?: string;
  testID?: string;
};

export function TextArea({
  value,
  onChangeText,
  placeholder = 'Type here...',
  label,
  error,
  maxLength = 500,
  accessibilityLabel,
  testID,
}: TextAreaProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {label ? (
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          colorScheme === 'dark' && styles.fieldDark,
          error && styles.fieldError,
          error && colorScheme === 'dark' && styles.fieldErrorDark,
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          accessibilityLabel={accessibilityLabel}
          multiline
          maxLength={maxLength}
          style={[styles.input, colorScheme === 'dark' && styles.inputDark]}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.footer}>
        {error ? (
          <Text style={[styles.error, colorScheme === 'dark' && styles.errorDark]}>{error}</Text>
        ) : null}
        <Text style={[styles.count, colorScheme === 'dark' && styles.countDark]}>
          {value.length}/{maxLength}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x2 },
  rootDark: {},
  label: {
    color: colors.ink,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  labelDark: { color: colors.ink },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    minHeight: 120,
    padding: space.x3,
  },
  fieldDark: { backgroundColor: colors.surface, borderColor: colors.border },
  fieldError: { borderColor: colors.error },
  fieldErrorDark: { borderColor: colors.error },
  input: {
    color: colors.ink,
    fontSize: 16,
    flex: 1,
    minHeight: 96,
  },
  inputDark: { color: colors.ink },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  error: { color: colors.error, fontSize: 12 },
  errorDark: { color: colors.error },
  count: { color: colors.muted, fontSize: 12 },
  countDark: { color: colors.muted },
});
