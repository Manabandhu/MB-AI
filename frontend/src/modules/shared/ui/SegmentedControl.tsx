import { XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

type Option<T extends string> = {
  value: T;
  label: string;
  icon?: AppIconName;
  /** Item count shown as a small badge after the label (e.g. "Requests 3"). Only pass real counts. */
  count?: number;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A small set of mutually exclusive choices (radio group semantics), each segment at least 44pt tall. */
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
        const hasCount = typeof option.count === 'number';
        return (
          <XStack
            aria-label={hasCount ? `${option.label}, ${option.count}` : option.label}
            role="radio"
            aria-checked={selected}
            alignItems="center"
            backgroundColor={selected ? '$surface' : 'transparent'}
            borderRadius={10}
            cursor="pointer"
            // Content-sized, then share the spare room: equal thirds/quarters cut "Rooms 0" to "Roo…" on phones.
            flexBasis="auto"
            flexGrow={1}
            flexShrink={1}
            focusVisibleStyle={{
              outlineWidth: 3,
              outlineStyle: 'solid',
              outlineColor: '$outlineColor',
            }}
            focusable
            gap="$x1"
            hoverStyle={selected ? undefined : { backgroundColor: '$surfaceContainer' }}
            justifyContent="center"
            key={option.value}
            minHeight="$touch"
            onPress={() => onChange(option.value)}
            {...keyboardPress(() => onChange(option.value))}
            paddingHorizontal="$x2"
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
            <AppText
              color={selected ? '$primary' : '$colorMuted'}
              numberOfLines={1}
              variant="label"
            >
              {option.label}
            </AppText>
            {hasCount ? (
              <XStack
                alignItems="center"
                backgroundColor={selected ? '$primary' : '$surfaceContainerHigh'}
                borderRadius="$pill"
                justifyContent="center"
                minWidth={20}
                paddingHorizontal={6}
              >
                <AppText color={selected ? '$onPrimary' : '$colorMuted'} variant="caption">
                  {option.count}
                </AppText>
              </XStack>
            ) : null}
          </XStack>
        );
      })}
    </XStack>
  );
}
