import { breakpoint, radius } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEvent, listEventCategories } from '@/modules/events/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useWindowDimensions } from '@/platform/windowDimensions';

const createScreenColors = (palette: ScreenPalette) => ({
  primary: palette.primary,
  primarySoft: palette.primaryTint,
  teal: palette.teal,
  tealSoft: palette.tealTint,
  accent: palette.warm,
  bg: palette.background,
  cardBg: palette.surface,
  border: palette.border,
  ink: palette.ink,
  inkMuted: palette.muted,
  errorBg: palette.errorBg,
  errorText: palette.error,
});

const DATE_PRESETS = [
  { label: 'Upcoming Saturday', offsetDays: 6 },
  { label: 'Upcoming Sunday', offsetDays: 7 },
  { label: 'Next Weekend', offsetDays: 13 },
];

function getDefaultDate(offset = 6): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(18, 0, 0, 0);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export default function CreateEventScreen() {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const C = createScreenColors(palette);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoint.medium;

  // Categories come from the backend; the event is uncategorised until one is picked.
  const { data: categories = [] } = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(getDefaultDate(6));
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const parsedDate = new Date(dateTime.replace(' ', 'T')).toISOString();
      return createEvent({
        title: title.trim(),
        description: description.trim(),
        startAt: parsedDate,
        endAt: parsedDate,
        location: isVirtual ? 'Online' : location.trim(),
        categoryId: selectedCategory ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['foundation', 'shell', 'explore'] });
      router.replace('/events');
    },
    onError: (err: Error) => {
      setError(err?.message ?? 'Failed to publish event. Please check inputs and try again.');
    },
  });

  const onSubmit = () => {
    if (!title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide event details and description.');
      return;
    }
    if (!location.trim() && !isVirtual) {
      setError('Please specify a venue or city location.');
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
              <Text style={s.headerEyebrow}>Events & Cultural Meetups</Text>
              <Text style={s.headerTitle}>Host a Community Event</Text>
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={s.errorBanner}>
              <AppIcon color={C.errorText} name="warning" size={18} />
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Main Card */}
          <View style={s.formCard}>
            {/* Category Chips */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>EVENT CATEGORY</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsRow}
              >
                {categories.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      accessibilityRole="button"
                      accessibilityLabel={cat.name}
                      onPress={() => setSelectedCategory(active ? null : cat.id)}
                      style={[s.categoryChip, active && s.categoryChipActive]}
                    >
                      <Text style={[s.categoryChipText, active && s.categoryChipTextActive]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Event Title */}
            <View style={s.fieldGroup}>
              <View style={s.labelWithCount}>
                <Text style={s.fieldLabel}>EVENT TITLE *</Text>
                <Text style={s.charCount}>{title.length}/100</Text>
              </View>
              <TextInput
                accessibilityLabel="Event title"
                placeholder="e.g. Austin Grand Diwali Mela 2026, Telugu Tech Mixer"
                placeholderTextColor={C.inkMuted}
                value={title}
                maxLength={100}
                onChangeText={setTitle}
                style={s.input}
              />
            </View>

            {/* Event Description */}
            <View style={s.fieldGroup}>
              <View style={s.labelWithCount}>
                <Text style={s.fieldLabel}>DESCRIPTION & AGENDA *</Text>
                <Text style={s.charCount}>{description.length}/2000</Text>
              </View>
              <TextInput
                accessibilityLabel="Event description"
                placeholder="Share venue timings, ticket/prasad info, parking guidelines, and what attendees should bring..."
                placeholderTextColor={C.inkMuted}
                value={description}
                maxLength={2000}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                onChangeText={setDescription}
                style={[s.input, s.textarea]}
              />
            </View>

            {/* Date & Time with Presets */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>DATE & TIME (YYYY-MM-DD HH:MM)</Text>
              <View style={s.presetsRow}>
                {DATE_PRESETS.map((p) => (
                  <Pressable
                    accessibilityRole="button"
                    key={p.label}
                    onPress={() => setDateTime(getDefaultDate(p.offsetDays))}
                    style={s.presetChip}
                  >
                    <Text style={s.presetChipText}>{p.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Event date and time"
                placeholder="2026-10-24 18:00"
                placeholderTextColor={C.inkMuted}
                value={dateTime}
                onChangeText={setDateTime}
                style={s.input}
              />
            </View>

            {/* Format: In-Person vs Virtual Toggle */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>EVENT FORMAT</Text>
              <View style={s.formatRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsVirtual(false)}
                  style={[s.formatOption, !isVirtual && s.formatOptionActive]}
                >
                  <AppIcon color={!isVirtual ? C.primary : C.inkMuted} name="map" size={18} />
                  <Text style={[s.formatOptionText, !isVirtual && s.formatOptionTextActive]}>
                    In-Person Venue
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsVirtual(true)}
                  style={[s.formatOption, isVirtual && s.formatOptionActive]}
                >
                  <AppIcon color={isVirtual ? C.primary : C.inkMuted} name="globe" size={18} />
                  <Text style={[s.formatOptionText, isVirtual && s.formatOptionTextActive]}>
                    Virtual / Online
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Venue Location (if in-person) */}
            {!isVirtual && (
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>VENUE & LOCATION *</Text>
                <TextInput
                  accessibilityLabel="Event venue and address"
                  placeholder="e.g. Zilker Park, Austin or 9801 Decker Lake Rd"
                  placeholderTextColor={C.inkMuted}
                  value={location}
                  onChangeText={setLocation}
                  style={s.input}
                />
              </View>
            )}

            {/* Trust Assurance Card */}
            <View style={s.trustBox}>
              <AppIcon color={C.teal} name="verified-user" size={20} />
              <Text style={s.trustBoxText}>
                Members can RSVP from the event page. As the host, you can see who is going.
              </Text>
            </View>

            {/* Submit Action */}
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
                  label={mutation.isPending ? 'Publishing Event...' : 'Publish Event'}
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

const createScreenStyles = (palette: ScreenPalette) => {
  const C = createScreenColors(palette);
  return StyleSheet.create({
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
      minHeight: 44,
      minWidth: 44,
      width: 40,
      height: 40,
      borderRadius: radius.card,
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
      color: C.accent,
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
      borderRadius: radius.control,
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
      borderRadius: radius.card,
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
      minHeight: 44,
      minWidth: 44,
      backgroundColor: C.bg,
      borderRadius: radius.card,
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
      color: palette.onPrimary,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    presetChip: {
      minHeight: 44,
      minWidth: 44,
      backgroundColor: C.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    presetChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: C.primary,
    },
    input: {
      backgroundColor: C.bg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: C.ink,
    },
    textarea: {
      minHeight: 120,
      paddingTop: 12,
    },
    formatRow: {
      flexDirection: 'row',
      gap: 10,
    },
    formatOption: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: C.bg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 12,
    },
    formatOptionActive: {
      backgroundColor: C.primarySoft,
      borderColor: C.primary,
    },
    formatOptionText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.inkMuted,
    },
    formatOptionTextActive: {
      color: C.primary,
    },
    trustBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.tealSoft,
      borderRadius: radius.control,
      padding: 12,
      gap: 10,
    },
    trustBoxText: {
      flex: 1,
      fontSize: 12,
      color: C.teal,
      lineHeight: 17,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 6,
    },
    cancelBtn: {
      minHeight: 44,
      minWidth: 44,
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
  });
};
