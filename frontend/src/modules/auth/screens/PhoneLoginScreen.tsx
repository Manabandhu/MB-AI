import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  AuthButton,
  AuthField,
  AuthNotice,
  AuthScreen,
  AuthSwitch,
} from '@/modules/auth/components/AuthKit';
import { CountryPickerSheet } from '@/modules/auth/components/CountryPickerSheet';
import { type CountryItem, supportedCountries } from '@/modules/auth/utils/authConstants';
import {
  friendlyAuthError,
  OTP_CODE_LENGTH,
  parsePhoneInput,
} from '@/modules/auth/utils/authHelpers';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

export function PhoneLoginScreen() {
  const signInWithPhone = useAuthStore((s) => s.signInWithPhone);
  const { palette } = useAppearance();
  const [country, setCountry] = useState<CountryItem>(supportedCountries[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [digits, setDigits] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const parsed = parsePhoneInput(country.code, digits);
    if (!parsed.ok) {
      setFieldError(parsed.error);
      return;
    }
    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithPhone(parsed.e164);
      router.push('/otp-verification');
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Sign in with your phone"
      subtitle={`We'll text you a ${OTP_CODE_LENGTH}-digit code. Message and data rates may apply.`}
      footer={
        <>
          <AuthButton label="Send code" loading={submitting} onPress={submit} />
          <AuthSwitch
            prompt="Prefer email?"
            action="Sign in with email"
            onPress={() => router.replace('/sign-in')}
          />
        </>
      }
    >
      {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      <AuthField
        label="Mobile number"
        value={digits}
        onChangeText={(value) => {
          // Keep a leading + so a pasted international number (+1 469…) is not prefixed twice.
          setDigits(value.replace(/[^\d\s()+.-]/g, ''));
          if (fieldError) setFieldError(null);
        }}
        error={fieldError}
        hint="Or enter the full number with its country code, like +1 469 555 0123"
        placeholder="(555) 000-0000"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="send"
        onSubmitEditing={submit}
        leading={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.name} ${country.code}. Change`}
            onPress={() => setPickerOpen(true)}
          >
            <XStack
              alignItems="center"
              borderRightColor="$borderColor"
              borderRightWidth={StyleSheet.hairlineWidth}
              gap="$x1"
              marginRight="$x1"
              minHeight={44}
              paddingRight="$x2"
            >
              <AppText fontSize={20}>{country.flag}</AppText>
              <AppText variant="bodyStrong">{country.code}</AppText>
              <AppIcon name="chevron-down" size={14} color={palette.muted} />
            </XStack>
          </Pressable>
        }
      />

      <CountryPickerSheet
        onClose={() => setPickerOpen(false)}
        onSelect={setCountry}
        selected={country}
        visible={pickerOpen}
      />
    </AuthScreen>
  );
}
