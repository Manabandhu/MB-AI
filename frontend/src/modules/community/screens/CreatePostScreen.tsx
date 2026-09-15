import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createPost } from '@/modules/community/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const C = {
  primary: '#431ebe',
  primarySoft: 'rgba(67,30,190,0.08)',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  accent: '#ff7e33',
  bg: '#faf8ff',
  cardBg: '#ffffff',
  border: '#e8e5f2',
  ink: '#1b1829',
  inkMuted: '#6b6882',
  errorBg: '#fee2e2',
  errorText: '#ba1a1a',
};

const CATEGORIES = [
  'General Discussion',
  'Housing & Sublets',
  'Rides & Commute',
  'Jobs & Referrals',
  'Culture & Events',
  'Visa & Legal Advice',
];

const SUGGESTED_TAGS = [
  '#Austin',
  '#UTAustin',
  '#RoommateNeeded',
  '#H1B',
  '#DesiEats',
  '#Sublease',
  '#AirportRide',
];

export function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [selectedCategory, setSelectedCategory] = useState('General Discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setImageUri(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const finalBody =
        selectedTags.length > 0 ? `${body.trim()}\n\n${selectedTags.join(' ')}` : body.trim();
      return createPost({
        communityId: communityId ?? 'c1',
        title: `[${selectedCategory}] ${title.trim()}`,
        body: finalBody,
        tags: selectedTags,
        imageUrl: imageUri ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'community'] });
      router.back();
    },
    onError: (err: Error) => {
      setError(err?.message ?? 'Failed to publish post. Please try again.');
    },
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const onSubmit = () => {
    if (!title.trim()) {
      setError('Please provide a post title.');
      return;
    }
    if (!body.trim()) {
      setError('Please write something in your post body.');
      return;
    }
    setError(null);
    mutation.mutate();
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={s.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon color={C.ink} name="chevron-left" size={20} />
            </Pressable>
            <View style={s.headerTextCol}>
              <Text style={s.headerEyebrow}>Community Forum</Text>
              <Text style={s.headerTitle}>Create a Post</Text>
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={s.errorBanner}>
              <AppIcon color={C.errorText} name="warning" size={18} />
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={s.formCard}>
            {/* Category Selector */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>SELECT TOPIC CATEGORY</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsRow}
              >
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      accessibilityRole="button"
                      accessibilityLabel={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[s.categoryChip, active && s.categoryChipActive]}
                    >
                      <Text style={[s.categoryChipText, active && s.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Title Input */}
            <View style={s.fieldGroup}>
              <View style={s.labelWithCount}>
                <Text style={s.fieldLabel}>POST TITLE *</Text>
                <Text style={s.charCount}>{title.length}/120</Text>
              </View>
              <TextInput
                accessibilityLabel="Post title"
                placeholder="What would you like to ask or share?"
                placeholderTextColor={C.inkMuted}
                value={title}
                maxLength={120}
                onChangeText={setTitle}
                style={s.input}
              />
            </View>

            {/* Body Textarea */}
            <View style={s.fieldGroup}>
              <View style={s.labelWithCount}>
                <Text style={s.fieldLabel}>DETAILS & CONTEXT *</Text>
                <Text style={s.charCount}>{body.length}/2000</Text>
              </View>
              <TextInput
                accessibilityLabel="Post details"
                placeholder="Share helpful context, location preferences, dates, or relevant questions for your peers..."
                placeholderTextColor={C.inkMuted}
                value={body}
                maxLength={2000}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                onChangeText={setBody}
                style={[s.input, s.textarea]}
              />
            </View>

            {/* Media Attachment */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>ATTACH MEDIA (OPTIONAL)</Text>
              {imageUri ? (
                <View style={s.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
                  <Pressable
                    style={s.removeImageBtn}
                    onPress={() => setImageUri(null)}
                    accessibilityLabel="Remove attached image"
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={s.uploadBtn}
                  onPress={pickImage}
                  accessibilityRole="button"
                  accessibilityLabel="Attach photo"
                >
                  <AppIcon color={C.primary} name="plus" size={20} />
                  <Text style={s.uploadBtnText}>Add Photo from Gallery</Text>
                </Pressable>
              )}
            </View>

            {/* Suggested Tags */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>TOPIC TAGS (OPTIONAL)</Text>
              <View style={s.tagsWrap}>
                {SUGGESTED_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[s.tagChip, active && s.tagChipActive]}
                    >
                      <Text style={[s.tagChipText, active && s.tagChipTextActive]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Community Standards Notice */}
            <View style={s.trustBox}>
              <AppIcon color={C.primary} name="shield" size={18} />
              <Text style={s.trustBoxText}>
                ManaBandhu discussions are moderated by verified community members. Be respectful
                and constructive.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={s.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => router.back()}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppButton
                  label={mutation.isPending ? 'Publishing...' : 'Publish Post'}
                  onPress={onSubmit}
                  disabled={mutation.isPending}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    padding: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: C.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.ink,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.errorBg,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: C.errorText,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  labelWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.inkMuted,
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 11,
    color: C.inkMuted,
    fontWeight: '600',
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    backgroundColor: C.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipActive: {
    backgroundColor: C.primarySoft,
    borderColor: C.primary,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkMuted,
  },
  tagChipTextActive: {
    color: C.primary,
    fontWeight: '800',
  },
  trustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primarySoft,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  trustBoxText: {
    flex: 1,
    fontSize: 12,
    color: C.ink,
    lineHeight: 17,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: C.inkMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(67,30,190,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
