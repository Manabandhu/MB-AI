import { color, space } from '@manabandhu/design-system';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';
import { AppIcon } from '../../shared/ui/AppIcon';
import { type CountryItem, supportedCountries } from '../authConstants';

export interface InlinePhoneInputProps {
  selectedCountry: CountryItem;
  onSelectCountry: (country: CountryItem) => void;
  phoneDigits: string;
  onChangePhoneDigits: (val: string) => void;
  editable?: boolean;
  placeholder?: string;
  accessibilityLabel?: string;
  onFocus?: () => void;
}

export function InlinePhoneInput({
  selectedCountry,
  onSelectCountry,
  phoneDigits,
  onChangePhoneDigits,
  editable = true,
  placeholder = '(555) 000-0000',
  accessibilityLabel = 'Mobile phone number',
  onFocus,
}: InlinePhoneInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Unified Input Box */}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {/* Country Selector Dropdown Pill inside the input */}
        <Pressable
          onPress={() => {
            if (editable) {
              setDropdownOpen((prev) => !prev);
            }
          }}
          disabled={!editable}
          style={styles.countryButton}
          accessibilityRole="combobox"
          accessibilityLabel={`Country dial code: ${selectedCountry.name} ${selectedCountry.code}`}
          accessibilityState={{ expanded: dropdownOpen }}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.code}</Text>
          <AppIcon name="chevron-down" size={13} color={color.muted} />
        </Pressable>

        {/* Divider line between country dropdown and phone digits */}
        <View style={styles.verticalDivider} />

        {/* Phone Digits Input Field */}
        <Input className="flex-1 border-0 bg-transparent min-h-12">
          <InputField
            placeholder={placeholder}
            keyboardType="phone-pad"
            accessibilityLabel={accessibilityLabel}
            value={phoneDigits}
            onChangeText={(val: string) => {
              if (dropdownOpen) setDropdownOpen(false);
              onChangePhoneDigits(val);
            }}
            editable={editable}
            onFocus={() => {
              setIsFocused(true);
              setDropdownOpen(false);
              onFocus?.();
            }}
            onBlur={() => setIsFocused(false)}
            style={styles.field}
          />
        </Input>

        <AppIcon name="phone" size={17} color={color.muted} />
      </View>

      {/* Inline Dropdown Popover attached directly beneath the input */}
      {dropdownOpen && editable ? (
        <View style={styles.dropdownPopover}>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {supportedCountries.map((c) => {
              const isSelected = c.code === selectedCountry.code;
              return (
                <Pressable
                  key={c.code + c.name}
                  onPress={() => {
                    onSelectCountry(c);
                    setDropdownOpen(false);
                  }}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} ${c.code}`}
                >
                  <Text style={styles.dropdownItemFlag}>{c.flag}</Text>
                  <Text style={styles.dropdownItemName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text
                    style={[styles.dropdownItemCode, isSelected && styles.dropdownItemCodeActive]}
                  >
                    {c.code}
                  </Text>
                  {isSelected ? (
                    <AppIcon name="check" size={13} color={color.primary} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    zIndex: 50,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.03)',
    borderColor: 'rgba(67, 30, 190, 0.15)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: space.x2,
    minHeight: 52,
    paddingHorizontal: space.x3,
  },
  inputWrapperFocused: {
    backgroundColor: '#ffffff',
    borderColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  inputWrapperDisabled: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    opacity: 0.7,
  },
  countryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 6,
    paddingRight: 4,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  verticalDivider: {
    backgroundColor: 'rgba(67, 30, 190, 0.15)',
    height: 24,
    width: 1,
  },
  field: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dropdownPopover: {
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 10,
    marginTop: 6,
    maxHeight: 220,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    top: 54,
    zIndex: 1000,
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
  },
  dropdownItemFlag: {
    fontSize: 17,
  },
  dropdownItemName: {
    color: color.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemCode: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItemCodeActive: {
    color: color.primary,
  },
});
