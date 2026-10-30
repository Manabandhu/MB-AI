import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { resolveAppIcon } from '../stepMeta';
import type { StepProps } from './types';

/** Step 4: Interests */
export function InterestsStep({ flow, styles, colors }: StepProps) {
  const { interestTags, setInterestTags, stepConfig } = flow;
  return (
    <View style={styles.stepContainer}>
      <View style={styles.chipsWrap}>
        {stepConfig?.options.map((opt) => {
          const isSelected = interestTags.includes(opt.optionKey);
          return (
            <Pressable
              key={opt.optionKey}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => {
                setInterestTags((prev) =>
                  isSelected ? prev.filter((k) => k !== opt.optionKey) : [...prev, opt.optionKey],
                );
              }}
              style={[styles.interestChip, isSelected && styles.interestChipSelected]}
            >
              <AppIcon
                color={isSelected ? colors.surface : colors.primary}
                name={resolveAppIcon(opt.category)}
                size={16}
              />
              <Text
                style={[styles.interestChipText, isSelected && styles.interestChipTextSelected]}
              >
                {opt.label}
              </Text>
              {isSelected && <AppIcon color={colors.surface} name="check" size={12} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
