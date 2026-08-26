import { color as colors, space } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type StarRatingProps = {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
};

export function StarRating({
  value,
  max = 5,
  size: _size = 24,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < Math.round(value);
        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1} star`}
            accessibilityState={{ selected: filled }}
            disabled={!interactive}
            onPress={() => interactive && onChange?.(index + 1)}
          >
            <Text
              style={[
                styles.star,
                filled && styles.starFilled,
                colorScheme === 'dark' && styles.starDark,
                filled && colorScheme === 'dark' && styles.starFilledDark,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: space.x1 },
  star: {
    color: colors.muted,
    fontSize: 24,
  },
  starDark: { color: colors.muted },
  starFilled: { color: colors.warning },
  starFilledDark: { color: colors.warning },
});
