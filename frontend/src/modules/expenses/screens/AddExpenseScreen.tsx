import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
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
  emerald: '#16a34a',
  emeraldSoft: '#dcfce7',
};

const CATEGORIES = [
  'Groceries & Subzi',
  'Rent & Electric',
  'Dining & Snacks',
  'Rides & Fuel',
  'Wifi & Utilities',
  'Household Essentials',
];

export function AddExpenseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Groceries & Subzi');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'you_paid' | 'roommate_paid'>('equal');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = () => {
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid expense amount greater than $0.');
      return;
    }
    setError(null);
    setSubmitted(true);
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
            ${parseFloat(amount).toFixed(2)} for "{title}" has been split and added to your group balance.
          </Text>
          <View style={s.successCard}>
            <View style={s.successRow}>
              <Text style={s.successLabel}>Category</Text>
              <Text style={s.successVal}>{selectedCategory}</Text>
            </View>
            <View style={s.successRow}>
              <Text style={s.successLabel}>Split Rule</Text>
              <Text style={s.successVal}>
                {splitMethod === 'equal' ? 'Split Equally (50/50)' : 'Individual Settlement'}
              </Text>
            </View>
          </View>
          <View style={{ width: '100%', maxWidth: 320, gap: 10, marginTop: 16 }}>
            <AppButton label="View All Balances" route="/expenses" />
            <Pressable
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
        <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
          {/* Header */}
          <View style={s.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={s.backBtn}
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
              <AppIcon color="#ba1a1a" name="warning" size={18} />
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.formCard}>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[s.categoryChip, active && s.categoryChipActive]}
                    >
                      <Text style={[s.categoryChipText, active && s.categoryChipTextActive]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Split Method */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>SPLIT METHOD</Text>
              <View style={s.splitRow}>
                <Pressable
                  onPress={() => setSplitMethod('equal')}
                  style={[s.splitOption, splitMethod === 'equal' && s.splitOptionActive]}
                >
                  <Text style={[s.splitOptionTitle, splitMethod === 'equal' && s.splitOptionTitleActive]}>
                    Split 50 / 50
                  </Text>
                  <Text style={s.splitOptionSub}>Equally between all flatmates</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSplitMethod('you_paid')}
                  style={[s.splitOption, splitMethod === 'you_paid' && s.splitOptionActive]}
                >
                  <Text style={[s.splitOptionTitle, splitMethod === 'you_paid' && s.splitOptionTitleActive]}>
                    You Paid Entirely
                  </Text>
                  <Text style={s.splitOptionSub}>Others owe you full amount</Text>
                </Pressable>
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
                <AppButton label="Save Expense" onPress={onSubmit} />
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
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#ba1a1a',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 20,
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
    borderRadius: 14,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
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
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitOption: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 12,
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
    borderRadius: 32,
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
    borderRadius: 14,
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
