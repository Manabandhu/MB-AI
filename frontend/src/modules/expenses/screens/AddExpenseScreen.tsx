import { breakpoint, radius } from '@manabandhu/design-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { createExpense, listExpenseGroups } from '@/modules/expenses/api';
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
  emerald: palette.success,
  emeraldSoft: palette.successBg,
});

const CATEGORIES = [
  'Groceries & Subzi',
  'Rent & Electric',
  'Dining & Snacks',
  'Rides & Fuel',
  'Wifi & Utilities',
  'Household Essentials',
];

export function AddExpenseScreen() {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const C = createScreenColors(palette);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoint.medium;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Groceries & Subzi');
  const params = useLocalSearchParams<{ groupId?: string }>();
  const queryClient = useQueryClient();
  const groups = useQuery({ queryKey: ['expenses', 'groups'], queryFn: listExpenseGroups });
  const [pickedGroupId, setPickedGroupId] = useState<string | null>(null);
  const groupId = pickedGroupId ?? params.groupId ?? groups.data?.[0]?.id ?? null;
  const groupName = groups.data?.find((g) => g.id === groupId)?.name;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      setError('Please enter a valid expense amount greater than $0.');
      return;
    }
    if (!groupId) {
      setError('Create or join an expense group first.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createExpense({
        groupId,
        title: title.trim(),
        amount: num,
        category: selectedCategory.includes('Rent')
          ? 'RENT'
          : selectedCategory.includes('Wifi')
            ? 'WIFI'
            : selectedCategory.includes('Fuel')
              ? 'GAS_TOLLS'
              : selectedCategory.includes('Groceries')
                ? 'GROCERIES'
                : 'GENERAL',
        splitType: 'EQUAL',
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to record the expense. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <View style={s.successBadge}>
            <AppIcon color="#ffffff" name="check" size={32} />
          </View>
          <Text style={s.successTitle}>Expense Recorded!</Text>
          <Text style={s.successBody}>
            ${parseFloat(amount).toFixed(2)} for "{title}" has been split equally and added to{' '}
            {groupName ?? 'your group'}.
          </Text>
          <View style={s.successCard}>
            <View style={s.successRow}>
              <Text style={s.successLabel}>Category</Text>
              <Text style={s.successVal}>{selectedCategory}</Text>
            </View>
            <View style={s.successRow}>
              <Text style={s.successLabel}>Split Rule</Text>
              <Text style={s.successVal}>Split equally</Text>
            </View>
          </View>
          <View style={{ width: '100%', maxWidth: 320, gap: 10, marginTop: 16 }}>
            <AppButton label="View All Balances" route="/expenses" />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTitle('');
                setAmount('');
                setSubmitted(false);
              }}
              style={s.addAnotherBtn}
            >
              <Text style={s.addAnotherText}>Add Another Expense</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={s.headerEyebrow}>Shared Expenses</Text>
              <Text style={s.headerTitle}>Add an Expense</Text>
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={s.errorBanner}>
              <AppIcon color={palette.error} name="warning" size={18} />
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.formCard}>
            {/* Group */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>GROUP *</Text>
              {groups.data && groups.data.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {groups.data.map((g) => (
                    <Pressable
                      key={g.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: g.id === groupId }}
                      onPress={() => setPickedGroupId(g.id)}
                      style={[s.groupChip, g.id === groupId && s.splitOptionActive]}
                    >
                      <Text
                        style={[s.splitOptionTitle, g.id === groupId && s.splitOptionTitleActive]}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Pressable accessibilityRole="link" onPress={() => router.push('/expenses/groups')}>
                  <Text style={s.splitOptionSub}>
                    {groups.isLoading
                      ? 'Loading your groups…'
                      : 'No groups yet — tap to create one.'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Amount Input */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>TOTAL AMOUNT *</Text>
              <View style={s.amountInputWrap}>
                <Text style={s.dollarSign}>$</Text>
                <TextInput
                  accessibilityLabel="Expense amount"
                  placeholder="0.00"
                  placeholderTextColor={C.inkMuted}
                  value={amount}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  style={s.amountInput}
                />
              </View>
            </View>

            {/* Title Input */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>WHAT WAS IT FOR? *</Text>
              <TextInput
                accessibilityLabel="Expense title"
                placeholder="e.g. Patel Brothers groceries, Electricity bill"
                placeholderTextColor={C.inkMuted}
                value={title}
                onChangeText={setTitle}
                style={s.input}
              />
            </View>

            {/* Category Chips */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CATEGORY</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsRow}
              >
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={cat}
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

            {/* Split Method */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>SPLIT METHOD</Text>
              <View style={s.splitRow}>
                <View style={[s.splitOption, s.splitOptionActive]}>
                  <Text style={[s.splitOptionTitle, s.splitOptionTitleActive]}>Split equally</Text>
                  <Text style={s.splitOptionSub}>Between everyone in the group</Text>
                </View>
              </View>
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
                  label="Save Expense"
                  loading={saving}
                  disabled={saving}
                  onPress={onSubmit}
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
      color: C.primary,
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
      backgroundColor: '#fee2e2',
      borderRadius: radius.control,
      padding: 12,
      gap: 8,
      marginBottom: 16,
    },
    errorBannerText: {
      color: palette.error,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    formCard: {
      backgroundColor: C.cardBg,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: C.border,
      padding: 20,
      gap: 20,
    },
    groupChip: {
      minHeight: 44,
      minWidth: 44,
      marginRight: 8,
      backgroundColor: C.bg,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: C.inkMuted,
      letterSpacing: 0.5,
    },
    amountInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.bg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
    },
    dollarSign: {
      fontSize: 26,
      fontWeight: '800',
      color: C.primary,
    },
    amountInput: {
      flex: 1,
      fontSize: 26,
      fontWeight: '800',
      color: C.ink,
      padding: 0,
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
      color: '#ffffff',
    },
    splitRow: {
      flexDirection: 'row',
      gap: 10,
    },
    splitOption: {
      flex: 1,
      backgroundColor: C.bg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      gap: 4,
    },
    splitOptionActive: {
      backgroundColor: C.primarySoft,
      borderColor: C.primary,
    },
    splitOptionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: C.ink,
    },
    splitOptionTitleActive: {
      color: C.primary,
    },
    splitOptionSub: {
      fontSize: 11,
      color: C.inkMuted,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
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
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successBadge: {
      width: 64,
      height: 64,
      borderRadius: radius.panel,
      backgroundColor: C.emerald,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: C.ink,
      marginBottom: 8,
    },
    successBody: {
      fontSize: 14,
      color: C.inkMuted,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
      marginBottom: 20,
    },
    successCard: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
      gap: 10,
    },
    successRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    successLabel: {
      fontSize: 12,
      color: C.inkMuted,
      fontWeight: '600',
    },
    successVal: {
      fontSize: 13,
      fontWeight: '700',
      color: C.ink,
    },
    addAnotherBtn: {
      minHeight: 44,
      minWidth: 44,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addAnotherText: {
      fontSize: 14,
      fontWeight: '700',
      color: C.primary,
    },
  });
};
