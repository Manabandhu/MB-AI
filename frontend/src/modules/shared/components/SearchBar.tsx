import { XStack, YStack } from 'tamagui';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { TextField } from '@/modules/shared/ui/TextField';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  accessibilityLabel?: string;
};

/** Compatibility adapter: old screens get the same usable search field as the new screen system. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onFilter,
  accessibilityLabel = 'Search',
}: SearchBarProps) {
  return (
    <XStack alignItems="center" gap="$x2">
      <YStack flex={1} minWidth={0}>
        <TextField
          aria-label={accessibilityLabel}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          leadingIcon="search"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          trailing={
            value ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => onChangeText('')}
                variant="plain"
              />
            ) : undefined
          }
        />
      </YStack>
      {onFilter ? <IconButton icon="filter" label="Filters" onPress={onFilter} /> : null}
    </XStack>
  );
}
