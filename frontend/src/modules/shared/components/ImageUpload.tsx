import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type ImageUploadProps = {
  value?: string;
  onSelect: (uri: string) => void;
  label?: string;
  error?: string;
};

export function ImageUpload({ value, onSelect, label, error }: ImageUploadProps) {
  const colorScheme = useColorScheme();

  const pick = () => {
    onSelect('placeholder://sample');
  };

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {label ? (
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Pick image"
        onPress={pick}
        style={[styles.picker, colorScheme === 'dark' && styles.pickerDark]}
      >
        {value ? (
          <View style={styles.preview}>
            <Text style={[styles.previewText, colorScheme === 'dark' && styles.previewTextDark]}>
              Image selected
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, colorScheme === 'dark' && styles.placeholderDark]}>
            Tap to choose photo
          </Text>
        )}
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.error, colorScheme === 'dark' && styles.errorDark]}>{error}</Text>
      ) : null}
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
  picker: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderStyle: 'dashed',
    borderWidth: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerDark: { backgroundColor: colors.surface, borderColor: colors.border },
  preview: { padding: space.x4 },
  previewText: { color: colors.primary, fontSize: 15 },
  previewTextDark: { color: colors.primary },
  placeholder: { color: colors.muted, fontSize: 15 },
  placeholderDark: { color: colors.muted },
  error: { color: colors.error, fontSize: 12 },
  errorDark: { color: colors.error },
});
