import { space } from '@manabandhu/design-system';
import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { StepProps } from './types';

/** Step 3: Languages */
export function LanguagesStep({ flow, styles, colors }: StepProps) {
  const {
    primaryLanguage,
    setPrimaryLanguage,
    secondaryLanguages,
    setSecondaryLanguages,
    stepConfig,
  } = flow;
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionHeader}>Primary Language</Text>
      <Text style={styles.helperText}>
        Choose the language you are most comfortable communicating in
      </Text>
      <View style={styles.chipsWrap}>
        {stepConfig?.options.map((opt) => {
          const isPrimary = primaryLanguage === opt.optionKey;
          return (
            <Pressable
              key={opt.optionKey}
              accessibilityRole="radio"
              accessibilityState={{ checked: isPrimary }}
              onPress={() => setPrimaryLanguage(opt.optionKey)}
              style={[styles.langChip, isPrimary && styles.langChipPrimary]}
            >
              <Text style={[styles.langChipText, isPrimary && styles.langChipTextPrimary]}>
                {opt.label}
              </Text>
              {isPrimary && <AppIcon color={colors.surface} name="check" size={14} />}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionHeader, { marginTop: space.x6 }]}>
        Other Languages You Understand
      </Text>
      <Text style={styles.helperText}>Connect with neighbors across diverse communities</Text>
      <View style={styles.chipsWrap}>
        {stepConfig?.options
          .filter((opt) => opt.optionKey !== primaryLanguage)
          .map((opt) => {
            const isSelected = secondaryLanguages.includes(opt.optionKey);
            return (
              <Pressable
                key={opt.optionKey}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                onPress={() => {
                  setSecondaryLanguages((prev) =>
                    isSelected ? prev.filter((k) => k !== opt.optionKey) : [...prev, opt.optionKey],
                  );
                }}
                style={[styles.langChip, isSelected && styles.langChipSelected]}
              >
                <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected && <AppIcon color={colors.surface} name="check" size={14} />}
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}
