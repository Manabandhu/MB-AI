import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createReferralRequest } from '@/modules/referrals/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RequestReferralScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: createReferralRequest,
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
      type: 'request',
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
    });
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Request sent</Text>
          <Text style={styles.successBody}>
            Your referral request is now visible to the community.
          </Text>
          <AppButton label="View my referrals" onPress={() => router.replace('/referrals/mine')} />
          <AppButton
            label="Request another"
            onPress={() => router.replace('/referrals/request')}
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
          <Text style={styles.title}>Request a referral</Text>
          <Text style={styles.subtitle}>
            Ask the community for a referral to a job, service, or resource.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What do you need?</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder="e.g. Job referral at Acme Corp"
                  value={title}
                  onChangeText={setTitle}
                />
              </Input>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder="Describe what you're looking for"
                  value={description}
                  onChangeText={setDescription}
                />
              </Input>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category (optional)</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder="e.g. Tech, Healthcare, Legal"
                  value={category}
                  onChangeText={setCategory}
                />
              </Input>
            </View>
            <View style={styles.actions}>
              <AppButton
                label="Submit request"
                onPress={handleSubmit}
                loading={mutation.isPending}
              />
              <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: space.x4 },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  successTitle: { ...typography.h2, color: colors.success, textAlign: 'center' },
  successBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
