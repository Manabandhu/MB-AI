import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type DetailSection = {
  title?: string;
  body: string;
};

export type DetailScreenProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: React.ReactNode;
  sections?: readonly DetailSection[];
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
  children?: React.ReactNode;
};

export function DetailScreen({
  eyebrow,
  title,
  subtitle,
  image,
  sections = [],
  actions = [],
  children,
}: DetailScreenProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {image ? <View style={styles.image}>{image}</View> : null}
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

      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <View
              key={index}
              style={[
                styles.actionButton,
                action.variant === 'secondary'
                  ? [styles.secondary, colorScheme === 'dark' && styles.secondaryDark]
                  : [styles.primary, colorScheme === 'dark' && styles.primaryDark],
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  action.variant === 'secondary'
                    ? [styles.secondaryText, colorScheme === 'dark' && styles.secondaryTextDark]
                    : [styles.primaryText, colorScheme === 'dark' && styles.primaryTextDark],
                ]}
              >
                {action.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {children}

      {sections.map((section, index) => (
        <View key={index} style={[styles.section, colorScheme === 'dark' && styles.sectionDark]}>
          {section.title ? (
            <Text style={[styles.sectionTitle, colorScheme === 'dark' && styles.sectionTitleDark]}>
              {section.title}
            </Text>
          ) : null}
          <Text style={[styles.sectionBody, colorScheme === 'dark' && styles.sectionBodyDark]}>
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x6 },
  rootDark: {},
  image: { borderRadius: radius.card, overflow: 'hidden' },
  header: { gap: space.x2 },
  eyebrow: {
    color: colors.teal,
    fontSize: typography.overline.fontSize,
    fontWeight: typography.overline.fontWeight,
    letterSpacing: typography.overline.letterSpacing,
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  actionButton: {
    borderRadius: radius.control,
    paddingHorizontal: space.x5,
    paddingVertical: space.x3,
  },
  primary: { backgroundColor: colors.primary },
  primaryDark: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryDark: { backgroundColor: colors.primarySoft },
  actionText: { fontSize: 15, fontWeight: '700' },
  primaryText: { color: colors.surface },
  primaryTextDark: { color: colors.surface },
  secondaryText: { color: colors.primary },
  secondaryTextDark: { color: colors.primary },
  section: { gap: space.x2 },
  sectionDark: {},
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
  },
  sectionTitleDark: { color: colors.ink },
  sectionBody: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  sectionBodyDark: { color: colors.muted },
});
