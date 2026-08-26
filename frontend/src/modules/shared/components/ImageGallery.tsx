import { color as colors, space } from '@manabandhu/design-system';
import { Image, type ImageSourcePropType, StyleSheet, useColorScheme, View } from 'react-native';

export type ImageGalleryProps = {
  images: readonly ImageSourcePropType[];
  accessibilityLabel?: string;
};

export function ImageGallery({ images, accessibilityLabel = 'Image gallery' }: ImageGalleryProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      <View style={styles.carousel}>
        {images.map((source, index) => (
          <Image
            key={index}
            source={source}
            accessibilityLabel={`${accessibilityLabel} ${index + 1}`}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </View>
      <View style={styles.dots}>
        {images.map((_, index) => (
          <View key={index} style={[styles.dot, index === 0 && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x3 },
  rootDark: {},
  carousel: {},
  image: { width: '100%', height: 220 },
  dots: { flexDirection: 'row', gap: space.x2, justifyContent: 'center' },
  dot: {
    backgroundColor: colors.muted,
    borderRadius: 4,
    height: 6,
    opacity: 0.4,
    width: 6,
  },
  dotActive: { backgroundColor: colors.primary, opacity: 1 },
});
