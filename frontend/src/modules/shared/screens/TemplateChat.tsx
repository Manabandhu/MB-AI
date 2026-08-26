import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { MessageBubble } from '../components/MessageBubble';

export type ChatMessage = {
  id: string;
  body: string;
  time: string;
  sent: boolean;
};

export type TemplateChatProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  messages: readonly ChatMessage[];
  input?: React.ReactNode;
};

export function TemplateChat({ eyebrow, title, subtitle, messages, input }: TemplateChatProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      <View style={styles.header}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, colorScheme === 'dark' && styles.eyebrowDark]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, colorScheme === 'dark' && styles.subtitleDark]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.messages}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            body={message.body}
            time={message.time}
            sent={message.sent}
          />
        ))}
      </View>

      {input ? <View style={styles.input}>{input}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x6 },
  rootDark: {},
  header: { gap: space.x2 },
  eyebrow: {
    color: colors.teal,
    fontSize: typography.overline.fontSize,
    fontWeight: typography.overline.fontWeight,
    textTransform: 'uppercase',
  },
  eyebrowDark: { color: colors.teal },
  title: {
    color: colors.ink,
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
  },
  titleDark: { color: colors.ink },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  subtitleDark: { color: colors.muted },
  messages: { gap: space.x3 },
  input: { marginTop: space.x2 },
});
