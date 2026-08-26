import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ProgressBar } from './ProgressBar';

export type FormScreenProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  progress?: number;
  loading?: boolean;
  error?: { title: string; body: string; retryLabel: string; onRetry: () => void };
  children: React.ReactNode;
  submitLabel?: string;
  onSubmit?: () => void;
};

export function FormScreen({
  eyebrow,
  title,
  subtitle,
  progress,
  loading: _loading = false,
  error,
  children,
  submitLabel,
  onSubmit,
}: FormScreenProps) {
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

      {progress != null ? <ProgressBar value={progress} /> : null}

      {error ? (
        <View style={[styles.errorBox, colorScheme === 'dark' && styles.errorBoxDark]}>
          <Text style={[styles.errorTitle, colorScheme === 'dark' && styles.errorTitleDark]}>
            {error.title}
          </Text>
          <Text style={[styles.errorBody, colorScheme === 'dark' && styles.errorBodyDark]}>
            {error.body}
          </Text>
          <View style={styles.errorAction}>{error.retryLabel}</View>
        </View>
      ) : null}

      <View style={styles.form}>{children}</View>

      {submitLabel && onSubmit ? (
        <View style={styles.footer}>
          <View style={[styles.submit, colorScheme === 'dark' && styles.submitDark]}>
            <Text style={[styles.submitText, colorScheme === 'dark' && styles.submitTextDark]}>
              {submitLabel}
            </Text>
          </View>
        </View>
      ) : null}
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
  form: { gap: space.x4 },
  errorBox: {
    backgroundColor: colors.error,
    borderRadius: radius.control,
    padding: space.x4,
  },
  errorBoxDark: { backgroundColor: colors.error },
  errorTitle: {
    color: colors.surface,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  errorTitleDark: { color: colors.surface },
  errorBody: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    marginTop: space.x1,
  },
  errorBodyDark: { color: colors.surface },
  errorAction: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    marginTop: space.x3,
    paddingVertical: space.x3,
  },
  footer: { marginTop: space.x2 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingVertical: space.x3,
    alignItems: 'center',
  },
  submitDark: { backgroundColor: colors.primary },
  submitText: {
    color: colors.surface,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  submitTextDark: { color: colors.surface },
});
