import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type MessageBubbleProps = {
  body: string;
  time: string;
  sent: boolean;
};

export function MessageBubble({ body, time, sent }: MessageBubbleProps) {
  const colorScheme = useColorScheme();

  return (
    <View
      style={[
        styles.root,
        sent ? styles.sent : styles.received,
        colorScheme === 'dark' && styles.rootDark,
      ]}
    >
      <Text
        style={[
          styles.body,
          sent
            ? [styles.bodySent, colorScheme === 'dark' && styles.bodySentDark]
            : [styles.bodyReceived, colorScheme === 'dark' && styles.bodyReceivedDark],
        ]}
      >
        {body}
      </Text>
      <Text
        style={[
          styles.time,
          sent
            ? [styles.timeSent, colorScheme === 'dark' && styles.timeSentDark]
            : [styles.timeReceived, colorScheme === 'dark' && styles.timeReceivedDark],
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.card,
    maxWidth: '80%',
    padding: space.x3,
  },
  rootDark: {},
  sent: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  received: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  body: { fontSize: 15, lineHeight: 21 },
  bodySent: { color: colors.surface },
  bodySentDark: { color: colors.surface },
  bodyReceived: { color: colors.ink },
  bodyReceivedDark: { color: colors.ink },
  time: { fontSize: 11, fontWeight: '600', marginTop: space.x1 },
  timeSent: { color: colors.surface, opacity: 0.85 },
  timeSentDark: { color: colors.surface },
  timeReceived: { color: colors.muted },
  timeReceivedDark: { color: colors.muted },
});
