import { color as baseColors, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';

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

export function ChooseLoginMethodScreen() {
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
          <Text style={styles.authTitle}>Choose Login Method</Text>
          <Text style={styles.authBody}>Pick how you would like to continue.</Text>
        </View>
        <View style={styles.form}>
          <AppButton icon="message" label="Continue with phone" route="/phone-login" />
          <AppButton
            icon="user"
            label="Continue with email"
            route="/email-login"
            variant="secondary"
          />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/sign-in')}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </Pressable>
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
  backLink: { alignSelf: 'center', marginTop: space.x3 },
  backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
