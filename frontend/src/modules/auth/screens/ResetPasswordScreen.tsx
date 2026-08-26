import { color as baseColors, space } from '@manabandhu/design-system';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const colors = {
  ...baseColors,
  appPrimary: '#2c0096',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  appShellSurface: '#efedf4',
  warm: '#ff7e33',
};

export function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.authHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.headerTitle}>ManaBandhu</Text>
          </View>
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallbackText className="text-primary-foreground">MB</AvatarFallbackText>
          </Avatar>
        </View>
        <View style={styles.authHero}>
          <Text style={styles.authTitle}>Reset Password</Text>
          <Text style={styles.authBody}>Create a new password for your account.</Text>
        </View>
        <View style={styles.form}>
          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Password updated</Text>
              <Text style={styles.successBody}>You can now sign in with your new password.</Text>
              <AppButton label="Go to Sign In" route="/sign-in" />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New password</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Enter new password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </Input>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm password</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </Input>
              </View>
              <AppButton label="Reset password" onPress={() => setSuccess(true)} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.x4 },
  authHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,255,0.92)',
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    marginBottom: space.x6,
    paddingHorizontal: space.x4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  headerTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  authHero: { alignItems: 'center', gap: space.x2, marginBottom: space.x6, marginTop: space.x16 },
  authTitle: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    textAlign: 'center',
  },
  authBody: { color: colors.muted, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  successBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    gap: space.x3,
    padding: space.x4,
  },
  successTitle: { color: colors.success, fontSize: 18, fontWeight: '800' },
  successBody: { color: colors.muted, fontSize: 15, lineHeight: 23 },
});
