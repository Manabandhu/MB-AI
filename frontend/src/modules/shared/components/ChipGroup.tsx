import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type ChipOption = {
  label: string;
  value: string;
};

export type ChipGroupProps = {
  options: readonly ChipOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  multi?: boolean;
};

export function ChipGroup({ options, selected, onToggle, multi: _multi = true }: ChipGroupProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onToggle(option.value)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              colorScheme === 'dark' && styles.chipDark,
              isSelected && colorScheme === 'dark' && styles.chipSelectedDark,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
                colorScheme === 'dark' && styles.labelDark,
                isSelected && colorScheme === 'dark' && styles.labelSelectedDark,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  chipDark: { backgroundColor: colors.surface, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipSelectedDark: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  labelDark: { color: colors.ink },
  labelSelected: { color: colors.primary },
  labelSelectedDark: { color: colors.primary },
});
