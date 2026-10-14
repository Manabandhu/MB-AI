import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { XStack } from 'tamagui';

type FilterChipRowProps = {
  /** Names the group for screen readers ("Condition", "Price"). */
  label: string;
  children: ReactNode;
  /** `radiogroup` when the chips are `radio` (one of many); `group` for independent toggles. */
  role?: 'group' | 'radiogroup';
};

/** One horizontally scrolling row of `Chip`s. Keeps taps working while the keyboard is open. */
export function FilterChipRow({ label, children, role = 'group' }: FilterChipRowProps) {
  return (
    <ScrollView
      accessibilityLabel={label}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      <XStack aria-label={label} gap="$x2" paddingVertical={4} role={role}>
        {children}
      </XStack>
    </ScrollView>
  );
}
