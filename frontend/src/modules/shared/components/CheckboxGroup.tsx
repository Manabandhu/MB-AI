import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type CheckboxOption = {
  label: string;
  value: string;
};

export type CheckboxGroupProps = {
  label?: string;
  options: readonly CheckboxOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
};

export function CheckboxGroup({ label, options, selected, onToggle }: CheckboxGroupProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {label ? (
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      ) : null}
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
              onPress={() => onToggle(option.value)}
              style={styles.option}
            >
              <View
                style={[
                  styles.box,
                  isSelected && styles.boxSelected,
                  colorScheme === 'dark' && styles.boxDark,
                  isSelected && colorScheme === 'dark' && styles.boxSelectedDark,
                ]}
              >
                {isSelected ? (
                  <Text style={[styles.check, colorScheme === 'dark' && styles.checkDark]}>✓</Text>
                ) : null}
              </View>
              <Text style={[styles.optionLabel, colorScheme === 'dark' && styles.optionLabelDark]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  options: { gap: space.x2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  box: {
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    height: 22,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDark: { borderColor: colors.border },
  boxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxSelectedDark: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  checkDark: { color: colors.surface },
  optionLabel: { color: colors.ink, fontSize: 15 },
  optionLabelDark: { color: colors.ink },
});
