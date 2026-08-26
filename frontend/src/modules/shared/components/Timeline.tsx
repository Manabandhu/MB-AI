import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type TimelineItem = {
  title: string;
  body?: string;
  time?: string;
};

export type TimelineProps = {
  items: readonly TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root}>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.track}>
            <View style={[styles.dot, colorScheme === 'dark' && styles.dotDark]} />
            {index < items.length - 1 ? (
              <View style={[styles.line, colorScheme === 'dark' && styles.lineDark]} />
            ) : null}
          </View>
          <View style={styles.texts}>
            <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>
              {item.title}
            </Text>
            {item.body ? (
              <Text style={[styles.body, colorScheme === 'dark' && styles.bodyDark]}>
                {item.body}
              </Text>
            ) : null}
            {item.time ? (
              <Text style={[styles.time, colorScheme === 'dark' && styles.timeDark]}>
                {item.time}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x4 },
  row: { flexDirection: 'row', gap: space.x3 },
  track: { alignItems: 'center', width: 24 },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  dotDark: { backgroundColor: colors.primary },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    width: 2,
  },
  lineDark: { backgroundColor: colors.border },
  texts: { flex: 1, gap: space.x1 },
  title: {
    color: colors.ink,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  titleDark: { color: colors.ink },
  body: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  bodyDark: { color: colors.muted },
  time: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  timeDark: { color: colors.muted },
});
