import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface RoomPriceMarkerProps {
  price: string | number;
  isSelected?: boolean;
  onPress?: () => void;
}

export function RoomPriceMarker({ price, isSelected = false, onPress }: RoomPriceMarkerProps) {
  const formattedPrice =
    typeof price === 'number' ? `$${price}` : price.startsWith('$') ? price : `$${price}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Room price ${formattedPrice}`}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <View style={[styles.bubble, isSelected ? styles.bubbleSelected : styles.bubbleNormal]}>
        <Text
          style={[styles.priceText, isSelected ? styles.priceTextSelected : styles.priceTextNormal]}
        >
          {formattedPrice}
        </Text>
      </View>
      <View style={[styles.pointer, isSelected ? styles.pointerSelected : styles.pointerNormal]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      },
    }),
  },
  bubbleNormal: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#431ebe',
  },
  bubbleSelected: {
    backgroundColor: '#431ebe',
    borderWidth: 1.5,
    borderColor: '#431ebe',
    ...Platform.select({
      ios: {
        shadowColor: '#431ebe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {
        boxShadow: '0 4px 14px rgba(67,30,190,0.40)',
      },
    }),
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  priceTextNormal: {
    color: '#131b2e',
  },
  priceTextSelected: {
    color: '#ffffff',
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
  pointerNormal: {
    borderTopColor: '#431ebe',
  },
  pointerSelected: {
    borderTopColor: '#431ebe',
  },
});
