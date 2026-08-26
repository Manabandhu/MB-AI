import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  accessibilityLabel?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilter,
  accessibilityLabel = 'Search',
}: SearchBarProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      <View style={[styles.inner, colorScheme === 'dark' && styles.innerDark]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colorScheme === 'dark' ? colors.muted : colors.muted}
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          style={[styles.input, colorScheme === 'dark' && styles.inputDark]}
        />
        {value.length > 0 ? (
          <View
            style={styles.clear}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={[styles.clearText, colorScheme === 'dark' && styles.clearTextDark]}>
              ✕
            </Text>
          </View>
        ) : null}
      </View>
      {onFilter ? (
        <View accessible accessibilityRole="button" accessibilityLabel="Filter">
          <Text style={[styles.filterText, colorScheme === 'dark' && styles.filterTextDark]}>
            Filter
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  containerDark: {},
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: space.x3,
    gap: space.x2,
  },
  innerDark: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: space.x3,
    minHeight: 44,
  },
  inputDark: { color: colors.ink },
  clear: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.muted, fontSize: 16 },
  clearTextDark: { color: colors.muted },
  filterText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextDark: { color: colors.primary },
});
