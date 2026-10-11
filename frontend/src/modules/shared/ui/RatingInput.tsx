import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

const DEFAULT_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;

type RatingInputProps = {
  /** 0 means no rating yet. */
  value: number;
  onChange: (value: number) => void;
  /** Word for each star (index 0 is one star); its length sets the number of stars. */
  labels?: readonly string[];
  /** Group label read by screen readers. */
  label?: string;
};

/** 1–N star picker: 44pt stars with radio semantics and the chosen word underneath. */
export function RatingInput({
  value,
  onChange,
  labels = DEFAULT_LABELS,
  label = 'Rating',
}: RatingInputProps) {
  const { palette } = useAppearance();
  return (
    <YStack gap="$x1">
      <XStack aria-label={label} gap="$x1" role="radiogroup">
        {labels.map((word, index) => {
          const n = index + 1;
          return (
            <YStack
              alignItems="center"
              aria-checked={value === n}
              aria-label={`${n} ${n === 1 ? 'star' : 'stars'}, ${word}`}
              borderRadius="$pill"
              cursor="pointer"
              focusVisibleStyle={{
                outlineWidth: 3,
                outlineStyle: 'solid',
                outlineColor: '$outlineColor',
              }}
              focusable
              height="$touch"
              justifyContent="center"
              key={word}
              onPress={() => onChange(n)}
              pressStyle={{ opacity: 0.7 }}
              role="radio"
              width="$touch"
            >
              <AppIcon color={n <= value ? palette.warm : palette.muted} name="star" size={28} />
            </YStack>
          );
        })}
      </XStack>
      <AppText aria-live="polite" tone="muted" variant="caption">
        {value ? labels[value - 1] : 'Tap a star'}
      </AppText>
    </YStack>
  );
}
