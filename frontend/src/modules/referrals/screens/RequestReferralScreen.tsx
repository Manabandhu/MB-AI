import { zodResolver } from '@hookform/resolvers/zod';
import { color, space, typography } from '@manabandhu/design-system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  urgency: z.string().min(1, 'Urgency is required'),
  details: z.string().min(1, 'Details are required'),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function RequestReferralScreen() {
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState('');
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { category: '', urgency: '', details: '' },
  });

  const onSubmit = (_data: RequestFormData) => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenShell>
        <View style={styles.success}>
          <Text style={styles.successTitle}>Referral requested</Text>
          <Text style={styles.successBody}>
            Community members will be notified of your request.
          </Text>
          <AppButton label="Back to referrals" route="/referrals" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader title="Request referral" subtitle="Ask the community for help." />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <Input>
            <InputField placeholder="e.g. Plumbing, Tutoring" {...control.register('category')} />
          </Input>
          {errors.category ? <Text style={styles.error}>{errors.category.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Urgency</Text>
          <Input>
            <InputField placeholder="e.g. This week, ASAP" {...control.register('urgency')} />
          </Input>
          {errors.urgency ? <Text style={styles.error}>{errors.urgency.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Details</Text>
          <TextArea
            placeholder="Describe what you need..."
            value={details}
            onChangeText={setDetails}
          />
          {errors.details ? <Text style={styles.error}>{errors.details.message}</Text> : null}
        </View>
        <AppButton label="Request referral" onPress={handleSubmit(onSubmit)} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.x4, marginTop: space.x4 },
  field: { gap: space.x2 },
  label: {
    color: color.ink,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  error: { color: color.error, fontSize: typography.caption.fontSize },
  success: { gap: space.x4, padding: space.x6, alignItems: 'center' },
  successTitle: {
    color: color.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  successBody: { color: color.muted, fontSize: typography.body.fontSize, textAlign: 'center' },
});
