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

/** Legacy search field kept for older call sites: a `TextField` with a working clear button and optional filter. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilter,
  accessibilityLabel = 'Search',
}: SearchBarProps) {
  return (
    <XStack alignItems="center" gap="$x2">
      <YStack flex={1}>
        <TextField
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          leadingIcon="search"
          onChangeText={onChangeText}
          placeholder={placeholder}
          trailing={
            value.length > 0 ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => onChangeText('')}
                variant="plain"
              />
            ) : undefined
          }
          value={value}
        />
      </YStack>
      {onFilter ? <IconButton icon="filter" label="Filter" onPress={onFilter} /> : null}
    </XStack>
  );
}
