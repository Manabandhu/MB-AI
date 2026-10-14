import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  selected: CountryItem;
  onSelect: (country: CountryItem) => void;
  onClose: () => void;
};

/** Country / dial-code picker in the shared bottom sheet, searchable by name or code ("ind", "+44", "44"). */
export function CountryPickerSheet({ visible, selected, onSelect, onClose }: Props) {
  const { palette } = useAppearance();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return supportedCountries;
    return supportedCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.replace('+', '').startsWith(q),
    );
  }, [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet onClose={close} scrollable size="tall" title="Country or region" visible={visible}>
      <YStack gap="$x3" paddingBottom="$x2">
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          label="Search countries"
          leadingIcon="search"
          onChangeText={setQuery}
          placeholder="Name or dial code"
          trailing={
            query ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => setQuery('')}
                variant="plain"
              />
            ) : undefined
          }
          value={query}
        />
        <YStack aria-label="Countries" role="radiogroup">
          {matches.map((item) => {
            const isSelected = item.code === selected.code && item.name === selected.name;
            const choose = () => {
              onSelect(item);
              close();
            };
            return (
              <XStack
                alignItems="center"
                aria-checked={isSelected}
                aria-label={`${item.name} ${item.code}`}
                borderRadius="$control"
                cursor="pointer"
                focusVisibleStyle={{
                  outlineWidth: 3,
                  outlineStyle: 'solid',
                  outlineColor: '$outlineColor',
                }}
                focusable
                gap="$x3"
                hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
                key={item.code + item.name}
                minHeight={52}
                onPress={choose}
                {...keyboardPress(choose)}
                paddingHorizontal="$x2"
                pressStyle={{ backgroundColor: '$surfaceContainer' }}
                role="radio"
              >
                <AppText aria-hidden fontSize={20}>
                  {item.flag}
                </AppText>
                <AppText flex={1} numberOfLines={1} variant="body">
                  {item.name}
                </AppText>
                <AppText tone="muted" variant="body">
                  {item.code}
                </AppText>
                {isSelected ? <AppIcon color={palette.primary} name="check" size={18} /> : null}
              </XStack>
            );
          })}
          {matches.length === 0 ? (
            <AppText paddingVertical="$x4" textAlign="center" tone="muted">
              No supported country matches "{query.trim()}". Type the full number starting with +
              instead.
            </AppText>
          ) : null}
        </YStack>
      </YStack>
    </BottomSheet>
  );
}
