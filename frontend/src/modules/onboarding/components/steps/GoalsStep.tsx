import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAppearance } from '@/theme/ThemeProvider';
import { resolveAppIcon } from '../../utils/stepMeta';
import type { StepProps } from './types';

/** Step 1: Goals / Reasons */
export function GoalsStep({ flow, styles, colors }: StepProps) {
  const { selectedReasons, setSelectedReasons, stepConfig } = flow;
  const { reduceMotion } = useAppearance();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
          Select one or more goals to tailor your discovery feed
        </Text>
        <Text style={styles.countBadgeText}>{selectedReasons.length} selected</Text>
      </View>

      <View style={styles.cardGrid}>
        {stepConfig?.options.map((opt) => {
          const isSelected = selectedReasons.includes(opt.optionKey);
          return (
            <Pressable
              key={opt.optionKey}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
                setSelectedReasons((prev) =>
                  isSelected ? prev.filter((k) => k !== opt.optionKey) : [...prev, opt.optionKey],
                );
              }}
              style={({ pressed }) => [
                styles.goalCard,
                isSelected && styles.goalCardSelected,
                pressed && !reduceMotion && styles.goalCardPressed,
              ]}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <AppIcon
                  color={isSelected ? colors.surface : colors.primary}
                  name={resolveAppIcon(opt.iconName)}
                  size={22}
                />
              </View>
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                {opt.label}
              </Text>
              {opt.description ? (
                <Text style={styles.cardDescription}>{opt.description}</Text>
              ) : null}
              {isSelected ? (
                <Animated.View
                  entering={reduceMotion ? undefined : ZoomIn.springify().damping(12)}
                  exiting={reduceMotion ? undefined : ZoomOut.duration(120)}
                  style={styles.checkmarkBadge}
                >
                  <AppIcon color={colors.surface} name="check" size={13} strokeWidth={3} />
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.reassuranceCard}>
        <AppIcon color={colors.teal} name="shield" size={18} />
        <Text style={styles.reassuranceText}>
          You can change these anytime in your Profile & Discovery settings.
        </Text>
      </View>
    </View>
  );
}
