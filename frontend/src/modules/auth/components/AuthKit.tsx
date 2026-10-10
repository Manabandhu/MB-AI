import { color, radius, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { forwardRef, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';

/** Width at which the auth flow switches from a full-bleed phone layout to a centered card. */
const CARD_BREAKPOINT = 600;

type AuthScreenProps = {
  title: string;
  subtitle?: ReactNode;
  /** Shown above the title; defaults to a back button when there is history. */
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
  /** Pinned above the home indicator on phones (primary action and secondary link). */
  footer?: ReactNode;
};

/**
 * iOS-first layout for every auth screen: safe-area aware, keyboard-avoiding, left-aligned large title, and a pinned
 * footer for the primary action. On tablets, foldables, and desktop the same content sits in a centered card.
 */
export function AuthScreen({
  title,
  subtitle,
  showBack = true,
  onBack,
  children,
  footer,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= CARD_BREAKPOINT;
  const goBack =
    onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/welcome')));

  const body = (
    <>
      <View style={styles.topBar}>
        {showBack ? (
          <Pressable
            role="button"
            aria-label="Go back"
            hitSlop={8}
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <AppIcon name="chevron-left" size={22} color={color.ink} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        {wide ? null : <BrandMark size={32} />}
      </View>
      {wide ? (
        <View style={styles.cardLogo}>
          <BrandMark size={52} />
        </View>
      ) : null}
      <Text role="heading" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, wide && styles.rootWide]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scroll,
          wide && styles.scrollWide,
          {
            paddingTop: insets.top + (wide ? space.x10 : space.x2),
            paddingBottom: wide ? insets.bottom + space.x10 : space.x6,
          },
        ]}
      >
        {wide ? (
          <View style={styles.card}>
            {body}
            {footer ? <View style={styles.cardFooter}>{footer}</View> : null}
          </View>
        ) : (
          body
        )}
      </ScrollView>
      {!wide && footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.x4) }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  /** Adds a show/hide toggle and keeps the value masked by default. */
  password?: boolean;
  leading?: ReactNode;
};

/** Labelled text field sized for touch (52pt) with a 17pt font so iOS Safari never zooms on focus. */
export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  { label, error, hint, password, leading, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          focused && styles.inputBoxFocused,
          error ? styles.inputBoxError : null,
        ]}
      >
        {leading}
        <TextInput
          ref={ref}
          aria-label={label}
          placeholderTextColor="#8e8a99"
          secureTextEntry={password ? !revealed : inputProps.secureTextEntry}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {password ? (
          <Pressable
            role="button"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            hitSlop={10}
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
          >
            <AppIcon name={revealed ? 'eye-closed' : 'eye'} size={20} color={color.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text role="alert" style={styles.fieldError}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'apple' | 'google' | 'link';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  accessibilityHint,
}: AuthButtonProps) {
  const inactive = disabled || loading;
  const textStyle = [
    styles.buttonText,
    variant === 'primary' || variant === 'apple' ? styles.buttonTextLight : null,
    variant === 'secondary' || variant === 'google' ? styles.buttonTextDark : null,
    variant === 'link' ? styles.linkText : null,
  ];
  return (
    <Pressable
      role="button"
      aria-label={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'link' ? styles.linkButton : styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'apple' && styles.apple,
        variant === 'google' && styles.google,
        inactive && variant !== 'link' && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'apple' ? '#ffffff' : color.primary}
        />
      ) : (
        <View style={styles.buttonRow}>
          {variant === 'apple' ? <AppIcon name="apple" size={19} color="#ffffff" /> : null}
          {variant === 'google' ? <AppIcon name="google" size={18} /> : null}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Sign in with Apple first, as Apple's guidelines expect when other social providers are offered. */
export function SocialButtons({
  onApple,
  onGoogle,
  busy,
}: {
  onApple: () => void;
  onGoogle: () => void;
  busy?: 'apple' | 'google' | null;
}) {
  return (
    <View style={styles.stack}>
      <AuthButton
        label="Continue with Apple"
        variant="apple"
        loading={busy === 'apple'}
        disabled={!!busy}
        onPress={onApple}
      />
      <AuthButton
        label="Continue with Google"
        variant="google"
        loading={busy === 'google'}
        disabled={!!busy}
        onPress={onGoogle}
      />
    </View>
  );
}

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <View style={styles.divider} aria-hidden>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function AuthNotice({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  return (
    <View
      role="alert"
      style={[
        styles.notice,
        tone === 'error' && styles.noticeError,
        tone === 'success' && styles.noticeSuccess,
        tone === 'info' && styles.noticeInfo,
      ]}
    >
      <AppIcon
        name={tone === 'error' ? 'warning' : tone === 'success' ? 'check' : 'mail'}
        size={18}
        color={tone === 'error' ? color.error : tone === 'success' ? color.success : color.primary}
      />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

/** "Prompt? Action" row used under forms, e.g. "New here? Create an account". */
export function AuthSwitch({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchPrompt}>{prompt}</Text>
      <Pressable role="link" hitSlop={10} onPress={onPress}>
        <Text style={styles.switchAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  stack: { gap: space.x3 },
  legal: { color: color.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  rootWide: { backgroundColor: color.background },
  scroll: { flexGrow: 1, paddingHorizontal: space.x6 },
  scrollWide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.x6 },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: color.surface,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingHorizontal: space.x8,
    paddingVertical: space.x8,
    shadowColor: '#131b2e',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardFooter: { marginTop: space.x6, gap: space.x3 },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 44, height: 44 },
  cardLogo: { marginBottom: space.x4 },
  title: {
    marginTop: space.x4,
    color: color.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: { marginTop: space.x2, color: color.muted, fontSize: 17, lineHeight: 24 },
  content: { marginTop: space.x6, gap: space.x5 },
  footer: {
    paddingHorizontal: space.x6,
    paddingTop: space.x3,
    gap: space.x3,
    backgroundColor: color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  field: { gap: space.x2 },
  label: { color: color.ink, fontSize: 15, fontWeight: '600' },
  inputBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9d5e4',
    backgroundColor: '#ffffff',
    paddingHorizontal: space.x4,
    gap: space.x2,
  },
  inputBoxFocused: { borderColor: color.primary, borderWidth: 2, paddingHorizontal: space.x4 - 1 },
  inputBoxError: { borderColor: color.error },
  // The bordered box already shows focus, so drop the browser's own outline on web.
  input: {
    flex: 1,
    minHeight: 50,
    color: color.ink,
    fontSize: 17,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  reveal: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hint: { color: color.muted, fontSize: 13, lineHeight: 18 },
  fieldError: { color: color.error, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.x5,
  },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.primarySoft },
  apple: { backgroundColor: '#000000' },
  google: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d9d5e4' },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  buttonText: { fontSize: 17, fontWeight: '600' },
  buttonTextLight: { color: '#ffffff' },
  buttonTextDark: { color: color.ink },
  linkButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: color.primary, fontSize: 16, fontWeight: '600' },
  stack: { gap: space.x3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#d9d5e4' },
  dividerText: { color: color.muted, fontSize: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x2,
    borderRadius: 12,
    padding: space.x3,
  },
  noticeError: { backgroundColor: '#fdecec' },
  noticeSuccess: { backgroundColor: '#e8f5ec' },
  noticeInfo: { backgroundColor: color.primarySoft },
  noticeText: { flex: 1, color: color.ink, fontSize: 15, lineHeight: 21 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  switchPrompt: { color: color.muted, fontSize: 15 },
  switchAction: { color: color.primary, fontSize: 15, fontWeight: '700' },
});
