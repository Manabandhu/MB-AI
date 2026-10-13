import { space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { friendlyAuthError, toE164 } from '@/modules/auth/authHelpers';
import {
  AuthButton,
  AuthField,
  AuthNotice,
  AuthScreen,
  AuthSwitch,
} from '@/modules/auth/components/AuthKit';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

export function PhoneLoginScreen() {
  const { styles, color } = useScreenStyles(createScreenStyles);
  const signInWithPhone = useAuthStore((s) => s.signInWithPhone);
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<CountryItem>(supportedCountries[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [digits, setDigits] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const number = digits.replace(/\D/g, '');
    if (number.length < 7 || number.length > 12) {
      setFieldError('Enter your mobile number without the country code');
      return;
    }
    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithPhone(toE164(country.code, number));
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
      subtitle="We'll text you a 6-digit code. Message and data rates may apply."
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
          setDigits(value.replace(/[^\d\s()-]/g, ''));
          if (fieldError) setFieldError(null);
        }}
        error={fieldError}
        placeholder="(555) 000-0000"
        keyboardType="phone-pad"
        autoComplete="tel-national"
        textContentType="telephoneNumber"
        returnKeyType="send"
        onSubmitEditing={submit}
        leading={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.name} ${country.code}. Change`}
            onPress={() => setPickerOpen(true)}
            style={styles.countryButton}
          >
            <Text style={styles.flag}>{country.flag}</Text>
            <Text style={styles.dial}>{country.code}</Text>
            <AppIcon name="chevron-down" size={14} color={color.muted} />
          </Pressable>
        }
      />

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.backdrop}
          onPress={() => setPickerOpen(false)}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.x4) }]}>
          <View style={styles.grabber} />
          <Text accessibilityRole="header" style={styles.sheetTitle}>
            Country or region
          </Text>
          <ScrollView>
            {supportedCountries.map((item) => {
              const selected = item.code === country.code && item.name === country.name;
              return (
                <Pressable
                  key={item.code + item.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name} ${item.code}`}
                  onPress={() => {
                    setCountry(item);
                    setPickerOpen(false);
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowCode}>{item.code}</Text>
                  {selected ? <AppIcon name="check" size={18} color={color.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </AuthScreen>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 44,
      paddingRight: space.x2,
      marginRight: space.x1,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: palette.border,
    },
    flag: { fontSize: 20 },
    dial: { color: palette.ink, fontSize: 17, fontWeight: '600' },
    backdrop: { minHeight: 44, minWidth: 44, flex: 1, backgroundColor: 'rgba(19,27,46,0.4)' },
    sheet: {
      maxHeight: '70%',
      backgroundColor: palette.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: space.x4,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: palette.surfaceContainerLow,
      marginTop: space.x2,
    },
    sheetTitle: {
      color: palette.ink,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
      marginVertical: space.x3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.x3,
      minHeight: 52,
      paddingHorizontal: space.x2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    rowPressed: { backgroundColor: palette.background },
    rowName: { flex: 1, color: palette.ink, fontSize: 17 },
    rowCode: { color: palette.muted, fontSize: 17 },
  });
};
