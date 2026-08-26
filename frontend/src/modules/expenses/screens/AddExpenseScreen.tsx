import { zodResolver } from '@hookform/resolvers/zod';
import { color, space, typography } from '@manabandhu/design-system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export function AddExpenseScreen() {
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { title: '', amount: '', category: '' },
  });

  const onSubmit = (_data: ExpenseFormData) => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenShell>
        <View style={styles.success}>
          <Text style={styles.successTitle}>Expense added</Text>
          <Text style={styles.successBody}>Your expense has been recorded successfully.</Text>
          <AppButton label="Back to groups" route="/expenses/groups" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader title="Add expense" subtitle="Record a new shared expense." />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <Input>
            <InputField placeholder="e.g. Dinner, Uber" {...control.register('title')} />
          </Input>
          {errors.title ? <Text style={styles.error}>{errors.title.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Amount</Text>
          <Input>
            <InputField
              placeholder="0.00"
              keyboardType="decimal-pad"
              {...control.register('amount')}
            />
          </Input>
          {errors.amount ? <Text style={styles.error}>{errors.amount.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <Input>
            <InputField placeholder="e.g. Food, Transport" {...control.register('category')} />
          </Input>
          {errors.category ? <Text style={styles.error}>{errors.category.message}</Text> : null}
        </View>
        <AppButton label="Add expense" onPress={handleSubmit(onSubmit)} />
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
