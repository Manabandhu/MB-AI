import { XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

type Option<T extends string> = { value: T; label: string; icon?: AppIconName };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A small set of mutually exclusive choices (radio group semantics). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { palette } = useAppearance();
  return (
    <XStack
      aria-label={label}
      role="radiogroup"
      backgroundColor="$surfaceContainerLow"
      borderRadius="$control"
      gap={4}
      padding={4}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <XStack
            aria-label={option.label}
            role="radio"
            aria-checked={selected}
            alignItems="center"
            backgroundColor={selected ? '$surface' : 'transparent'}
            borderRadius={10}
            cursor="pointer"
            flex={1}
            focusable
            gap="$x1"
            justifyContent="center"
            key={option.value}
            minHeight={40}
            onPress={() => onChange(option.value)}
            shadowColor={selected ? '$shadowColor' : 'transparent'}
            shadowOpacity={selected ? 0.08 : 0}
            shadowRadius={4}
          >
            {option.icon ? (
              <AppIcon
                color={selected ? palette.primary : palette.muted}
                name={option.icon}
                size={16}
              />
            ) : null}
            <AppText color={selected ? '$primary' : '$colorMuted'} variant="label">
              {option.label}
            </AppText>
          </XStack>
        );
      })}
    </XStack>
  );
}
