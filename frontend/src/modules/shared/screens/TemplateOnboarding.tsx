import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ProgressBar } from '../components/ProgressBar';

export type TemplateOnboardingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  children: React.ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  backLabel?: string;
  onBack?: () => void;
};

export function TemplateOnboarding({
  eyebrow,
  title,
  subtitle,
  step = 1,
  totalSteps = 5,
  children,
  nextLabel = 'Next',
  onNext,
  backLabel,
  onBack,
}: TemplateOnboardingProps) {
  const colorScheme = useColorScheme();
  const progress = (step / totalSteps) * 100;

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

      <ProgressBar value={progress} label={`Step ${step} of ${totalSteps}`} />

      <View style={styles.form}>{children}</View>

      <View style={styles.footer}>
        {backLabel && onBack ? (
          <View
            style={[styles.footerButton, styles.back, colorScheme === 'dark' && styles.backDark]}
          >
            <Text style={[styles.backText, colorScheme === 'dark' && styles.backTextDark]}>
              {backLabel}
            </Text>
          </View>
        ) : null}
        {nextLabel && onNext ? (
          <View
            style={[styles.footerButton, styles.next, colorScheme === 'dark' && styles.nextDark]}
          >
            <Text style={[styles.nextText, colorScheme === 'dark' && styles.nextTextDark]}>
              {nextLabel}
            </Text>
          </View>
        ) : null}
      </View>
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
  form: { gap: space.x4 },
  footer: { flexDirection: 'row', gap: space.x3, marginTop: space.x2 },
  footerButton: {
    borderRadius: radius.control,
    flex: 1,
    paddingVertical: space.x3,
    alignItems: 'center',
  },
  back: { backgroundColor: colors.primarySoft },
  backDark: { backgroundColor: colors.primarySoft },
  backText: { color: colors.primary, fontWeight: '700' },
  backTextDark: { color: colors.primary },
  next: { backgroundColor: colors.primary },
  nextDark: { backgroundColor: colors.primary },
  nextText: { color: colors.surface, fontWeight: '700' },
  nextTextDark: { color: colors.surface },
});
