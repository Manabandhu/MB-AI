import { space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createReferralOffer } from '@/modules/referrals/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { TextField } from '@/modules/shared/ui/TextField';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

export function OfferReferralScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: createReferralOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals', 'mine'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      serviceType: serviceType.trim(),
    });
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Offer posted</Text>
          <Text style={styles.successBody}>
            Your referral offer is now visible to the community.
          </Text>
          <AppButton label="View my referrals" onPress={() => router.replace('/referrals/mine')} />
          <AppButton
            label="Offer another"
            onPress={() => router.replace('/referrals/offer')}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Referrals</Text>
          <Text style={styles.title}>Offer a referral</Text>
          <Text style={styles.subtitle}>
            Offer a referral to a job, service, or resource in your network.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What can you refer?</Text>
              <TextField
                placeholder="e.g. Referral at Google for SWE"
                value={title}
                onChangeText={setTitle}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextField
                placeholder="Describe the opportunity and requirements"
                value={description}
                onChangeText={setDescription}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service type</Text>
              <TextField
                placeholder="e.g. Tech, Healthcare, Legal"
                value={serviceType}
                onChangeText={setServiceType}
              />
            </View>
            <View style={styles.actions}>
              <AppButton label="Submit offer" onPress={handleSubmit} loading={mutation.isPending} />
              <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    page: { backgroundColor: palette.background, flexGrow: 1, padding: space.x4 },
    container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
    eyebrow: { color: palette.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    title: { ...typography.h1, color: palette.ink },
    subtitle: { ...typography.body, color: palette.muted, marginBottom: space.x4 },
    form: { gap: space.x4 },
    inputGroup: { gap: space.x2 },
    inputLabel: { color: palette.ink, fontSize: 14, fontWeight: '700' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
    errorText: { color: palette.error, fontSize: 13, fontWeight: '700' },
    successTitle: { ...typography.h2, color: palette.success, textAlign: 'center' },
    successBody: { ...typography.body, color: palette.muted, textAlign: 'center' },
  });
};
