import { zodResolver } from '@hookform/resolvers/zod';
import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useAuthStore } from '@/lib/authStore';
import { createRoomListing, updateRoomListing } from '@/modules/rooms/api';
import type {
  CreateRoomListingInput,
  OwnerRoomListing,
  UpdateRoomListingInput,
} from '@/modules/rooms/types';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';

const roomFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => Number(v) > 0, 'Price must be greater than 0'),
  roomType: z.string().min(1, 'Room type is required').max(20),
  broadLocation: z.string().min(1, 'Area is required').max(200),
  exactAddress: z.string().max(4000),
  latitude: z
    .string()
    .refine((v) => v === '' || (Number(v) >= -90 && Number(v) <= 90), 'Invalid latitude'),
  longitude: z
    .string()
    .refine((v) => v === '' || (Number(v) >= -180 && Number(v) <= 180), 'Invalid longitude'),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

type RoomFormProps = {
  mode: 'create' | 'edit';
  initial?: OwnerRoomListing;
};

export function RoomForm({ mode, initial }: RoomFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === 'authenticated';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      price: initial?.price != null ? String(initial.price) : '',
      roomType: initial?.roomType ?? '',
      broadLocation: initial?.broadLocation ?? '',
      exactAddress: initial?.exactAddress ?? '',
      latitude: initial?.latitude != null ? String(initial.latitude) : '',
      longitude: initial?.longitude != null ? String(initial.longitude) : '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRoomListingInput) => createRoomListing(input),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      router.replace(`/rooms/${listing.id}/edit`);
    },
    onError: (error: Error) => setServerError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRoomListingInput) => updateRoomListing(initial?.id ?? '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      router.replace('/rooms/my-listings');
    },
    onError: (error: Error) => setServerError(error.message),
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    const input = {
      title: values.title,
      description: values.description,
      price: Number(values.price),
      roomType: values.roomType,
      broadLocation: values.broadLocation,
      exactAddress: values.exactAddress,
      latitude: values.latitude !== '' ? Number(values.latitude) : undefined,
      longitude: values.longitude !== '' ? Number(values.longitude) : undefined,
    };
    if (mode === 'create') {
      createMutation.mutate(input);
    } else {
      updateMutation.mutate(input);
    }
  });

  const fieldError = (key: keyof typeof errors) => errors[key]?.message;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Rooms</Text>
          <Text style={styles.title}>{mode === 'create' ? 'Create listing' : 'Edit listing'}</Text>
          <Text style={styles.subtitle}>
            Post a room with clear expectations, privacy-aware location, and moderation-friendly
            details.
          </Text>

          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Sunny private room"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  accessibilityLabel="Title"
                />
              )}
            />
            {fieldError('title') ? (
              <Text style={styles.fieldError}>{fieldError('title')}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextArea
                  value={value}
                  onChangeText={onChange}
                  label="Description"
                  maxLength={4000}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Monthly rent (USD)</Text>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="850"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={styles.input}
                  accessibilityLabel="Monthly rent"
                />
              )}
            />
            {fieldError('price') ? (
              <Text style={styles.fieldError}>{fieldError('price')}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Room type</Text>
            <Controller
              control={control}
              name="roomType"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Private room"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  accessibilityLabel="Room type"
                />
              )}
            />
            {fieldError('roomType') ? (
              <Text style={styles.fieldError}>{fieldError('roomType')}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Area (broad location)</Text>
            <Controller
              control={control}
              name="broadLocation"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Irving"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  accessibilityLabel="Area"
                />
              )}
            />
            {fieldError('broadLocation') ? (
              <Text style={styles.fieldError}>{fieldError('broadLocation')}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Exact address (private, owner only)</Text>
            <Controller
              control={control}
              name="exactAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="123 Main St (never shown publicly)"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  accessibilityLabel="Exact address"
                />
              )}
            />
          </View>

          <View style={styles.actions}>
            <AppButton
              label={mode === 'create' ? 'Save draft' : 'Save changes'}
              onPress={onSubmit}
              loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
            />
            <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
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
  subtitle: { ...typography.body, color: colors.muted },
  field: { gap: space.x2 },
  label: { ...typography.caption, color: colors.ink },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: space.x3,
  },
  fieldError: { color: colors.error, fontSize: 12 },
  errorBox: {
    backgroundColor: colors.error,
    borderRadius: radius.control,
    padding: space.x4,
  },
  errorText: { color: colors.surface, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
