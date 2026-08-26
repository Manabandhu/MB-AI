import { color as colors, radius, space } from '@manabandhu/design-system';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Toggle({ value, onValueChange, label, disabled = false }: ToggleProps) {
  const colorScheme = useColorScheme();
  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animated, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [value, animated]);

  const translateX = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: value
              ? colors.primary
              : colorScheme === 'dark'
                ? colors.border
                : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: space.x1,
    width: 48,
  },
  thumb: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 28,
    width: 28,
  },
});
