import { color as colors, contentWidth, radius, space } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost } from '@/modules/community/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FormScreen } from '@/modules/shared/components/FormScreen';
import { TextArea } from '@/modules/shared/components/TextArea';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function CreatePostScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const queryClient = useQueryClient();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createPost({
        communityId: communityId ?? 'c1',
        title: title.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'posts'] });
      router.back();
    },
  });

  const onSubmit = () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setError(null);
    mutation.mutate();
  };

  if (mutation.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Failed to create post"
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
        <View style={[styles.container, { maxWidth }]}>
          <FormScreen
            eyebrow="Community"
            title="Create a Post"
            subtitle="Share updates, questions, or resources with the community."
            submitLabel="Post"
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
                placeholder="Post title"
                placeholderTextColor={colors.muted}
                style={styles.input}
                accessibilityLabel="Post title"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Body</Text>
              <TextArea
                value={body}
                onChangeText={setBody}
                placeholder="What's on your mind?"
                accessibilityLabel="Post body"
              />
            </View>
          </FormScreen>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  field: { gap: space.x2 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    padding: space.x3,
  },
});
