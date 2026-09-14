import { zodResolver } from '@hookform/resolvers/zod';
import { color, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { createJobPosting } from '@/modules/jobs/api';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
});

type JobFormData = z.infer<typeof jobSchema>;

export function PostJobScreen() {
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: '', company: '', description: '', location: '' },
  });

  const mutation = useMutation({
    mutationFn: createJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'explore'] });
      setSubmitted(true);
    },
    onError: (err: Error) => {
      Alert.alert('Post Failed', err.message);
    },
  });

  const onSubmit = (data: JobFormData) => {
    mutation.mutate({
      title: data.title,
      company: data.company,
      description: data.description,
      location: data.location,
    });
  };

  if (submitted) {
    return (
      <ScreenShell>
        <View style={styles.success}>
          <Text style={styles.successTitle}>Job posted</Text>
          <Text style={styles.successBody}>Your job posting is now live.</Text>
          <AppButton label="Back to jobs" route="/jobs" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader title="Post a job" subtitle="Create a new job listing." />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <Input>
            <InputField placeholder="Job title" {...control.register('title')} />
          </Input>
          {errors.title ? <Text style={styles.error}>{errors.title.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          <Input>
            <InputField placeholder="Company name" {...control.register('company')} />
          </Input>
          {errors.company ? <Text style={styles.error}>{errors.company.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <Input>
            <InputField placeholder="City or remote" {...control.register('location')} />
          </Input>
          {errors.location ? <Text style={styles.error}>{errors.location.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextArea
            value={watch('description') ?? ''}
            onChangeText={(text) => setValue('description', text)}
            placeholder="Describe the role..."
          />
          {errors.description ? (
            <Text style={styles.error}>{errors.description.message}</Text>
          ) : null}
        </View>
        <AppButton label="Post job" onPress={handleSubmit(onSubmit)} loading={mutation.isPending} />
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
