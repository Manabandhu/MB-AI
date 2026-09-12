import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

function evaluateStrength(pwd: string): { score: number; label: string; colorCode: string } {
  if (!pwd) return { score: 0, label: '', colorCode: color.border };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;

  if (s <= 1) return { score: 1, label: 'Weak', colorCode: '#ba1a1a' };
  if (s === 2) return { score: 2, label: 'Fair', colorCode: '#ff7e33' };
  if (s === 3) return { score: 3, label: 'Good', colorCode: color.primary };
  return { score: 4, label: 'Strong', colorCode: color.teal };
}

export function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const storeError = useAuthStore((s) => s.error);
  const strength = evaluateStrength(password);

  async function handleReset() {
    if (!password || !confirmPassword) {
      setLocalError('Please enter both password fields.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please recheck.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().updatePassword(password);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password update failed';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title={success ? 'Password Updated!' : 'Set New Password'}
      subtitle={
        success
          ? 'Your password has been securely changed'
          : 'Choose a strong, memorable password for your account'
      }
      badgeText="Secure Password Reset"
      backHref="/sign-in"
    >
      {success ? (
        <View style={styles.successCard}>
          <View style={styles.checkIconWrap}>
            <AppIcon name="check" size={28} color={color.teal} strokeWidth={3} />
          </View>
          <Text style={styles.successTitle}>Account Secured</Text>
          <Text style={styles.successBody}>
            You can now sign in to ManaBandhu using your updated password.
          </Text>
          <AppButton label="Sign In with New Password →" onPress={() => router.push('/sign-in')} />
        </View>
      ) : (
        <>
          {/* New Password Input using Gluestack */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <View style={styles.textInputRow}>
              <AppIcon name="lock" size={18} color={color.muted} />
              <Input className="flex-1 border-0 bg-transparent min-h-12">
                <InputField
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setLocalError(null);
                  }}
                  accessibilityLabel="New Password Input"
                  style={styles.field}
                />
              </Input>
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                accessibilityRole="button"
              >
                <AppIcon name={showPassword ? 'eye-closed' : 'eye'} size={18} color={color.muted} />
              </Pressable>
            </View>

            {/* Password Strength Meter */}
            {password.length > 0 ? (
              <View style={styles.strengthBlock}>
                <View style={styles.strengthMeterRow}>
                  {[1, 2, 3, 4].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.strengthBar,
                        bar <= strength.score && { backgroundColor: strength.colorCode },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.colorCode }]}>
                  Strength: {strength.label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Confirm Password Input using Gluestack */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.textInputRow}>
              <AppIcon name="lock" size={18} color={color.muted} />
              <Input className="flex-1 border-0 bg-transparent min-h-12">
                <InputField
                  placeholder="Re-enter password"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (error) setLocalError(null);
                  }}
                  accessibilityLabel="Confirm Password Input"
                  style={styles.field}
                />
              </Input>
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeButton}
                accessibilityRole="button"
              >
                <AppIcon name={showConfirm ? 'eye-closed' : 'eye'} size={18} color={color.muted} />
              </Pressable>
            </View>
          </View>

          {/* Inline Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <AppIcon name="warning" size={16} color="#ba1a1a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button via Gluestack AppButton */}
          <AppButton
            label={loading ? 'Updating Password…' : 'Update Password →'}
            onPress={handleReset}
            loading={loading}
          />

          {/* Return to Sign In */}
          <Pressable
            onPress={() => router.push('/sign-in')}
            style={styles.backLink}
            accessibilityRole="link"
          >
            <Text style={styles.backLinkText}>Cancel & return to Sign In</Text>
          </Pressable>
        </>
      )}
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: space.x2,
  },
  inputLabel: {
    color: color.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textInputRow: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: space.x3,
  },
  field: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: space.x2,
  },
  eyeButton: {
    padding: space.x2,
  },
  strengthBlock: {
    gap: 4,
    marginTop: 4,
  },
  strengthMeterRow: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  strengthBar: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    flex: 1,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    padding: space.x3,
  },
  errorText: {
    color: '#ba1a1a',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: space.x2,
    paddingVertical: space.x1,
  },
  backLinkText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Success Card
  successCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.04)',
    borderColor: 'rgba(0, 105, 107, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x5,
  },
  checkIconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 60,
    justifyContent: 'center',
    width: 60,
    shadowColor: '#00696b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  successTitle: {
    color: color.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  successBody: {
    color: color.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
