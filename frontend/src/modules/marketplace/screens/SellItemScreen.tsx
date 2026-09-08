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

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.string().min(1, 'Price is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
});

type ListingFormData = z.infer<typeof listingSchema>;

export function SellItemScreen() {
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: { title: '', price: '', category: '', description: '' },
  });

  const onSubmit = (_data: ListingFormData) => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenShell>
        <View style={styles.success}>
          <Text style={styles.successTitle}>Listing created</Text>
          <Text style={styles.successBody}>Your item is now listed in the marketplace.</Text>
          <AppButton label="Back to marketplace" route="/marketplace" />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader title="Sell an item" subtitle="Create a new marketplace listing." />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <Input>
            <InputField placeholder="Item title" {...control.register('title')} />
          </Input>
          {errors.title ? <Text style={styles.error}>{errors.title.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <Input>
            <InputField placeholder="$0.00" {...control.register('price')} />
          </Input>
          {errors.price ? <Text style={styles.error}>{errors.price.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <Input>
            <InputField
              placeholder="e.g. Electronics, Furniture"
              {...control.register('category')}
            />
          </Input>
          {errors.category ? <Text style={styles.error}>{errors.category.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextArea
            placeholder="Describe condition, pickup location, etc."
            {...control.register('description')}
          />
          {errors.description ? (
            <Text style={styles.error}>{errors.description.message}</Text>
          ) : null}
        </View>
        <AppButton label="Create listing" onPress={handleSubmit(onSubmit)} />
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
