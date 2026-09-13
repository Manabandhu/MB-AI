import { color } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEvent } from '@/modules/events/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FormScreen } from '@/modules/shared/components/FormScreen';
import { TextArea } from '@/modules/shared/components/TextArea';

export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        title: title.trim(),
        description: description.trim(),
        startAt: date.trim() || new Date().toISOString(),
        endAt: date.trim() || new Date().toISOString(),
        location: location.trim(),
        latitude: 0,
        longitude: 0,
        categoryId: category.trim() || 'general',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.replace('/events');
    },
  });

  const onSubmit = () => {
    if (!title.trim() || !description.trim() || !date.trim() || !location.trim()) {
      setError('Title, description, date, and location are required.');
      return;
    }
    setError(null);
    mutation.mutate();
  };

  if (mutation.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Failed to create event"
          body={mutation.error.message}
          retryLabel="Try again"
          onRetry={onSubmit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <FormScreen
          eyebrow="Events"
          title="Host an Event"
          subtitle="Bring your community together for cultural, social, or networking events"
          submitLabel="Create Event"
          onSubmit={onSubmit}
          error={
            error
              ? {
                  title: 'Validation error',
                  body: error,
                  retryLabel: 'Fix',
                  onRetry: () => setError(null),
                }
              : undefined
          }
        >
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="What's this event about?"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="City or address"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Social, Career, etc."
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>
        </FormScreen>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  field: { gap: 6 },
  label: { color: color.ink, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 12,
    borderWidth: 1,
    color: color.ink,
    fontSize: 16,
    padding: 12,
  },
});
