import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { StepProps } from './types';

/** Step 7: Trust & Safety Pledge */
export function TrustStep({ flow, styles, colors }: StepProps) {
  const { saveError, setSaveError, pledgesAccepted, setPledgesAccepted, stepConfig } = flow;
  return (
    <View style={styles.stepContainer}>
      <View style={styles.pledgeHero}>
        <View style={styles.shieldBigBox}>
          <AppIcon color={colors.teal} name="shield" size={32} />
        </View>
        <Text style={styles.pledgeHeroTitle}>Our Community Trust Code</Text>
        <Text style={styles.pledgeHeroSub}>
          ManaBandhu works when everyone is honest and respectful. Agree to these pledges to join.
        </Text>
      </View>

      <View style={styles.pledgeList}>
        {stepConfig?.options.map((opt) => {
          const isChecked = !!pledgesAccepted[opt.optionKey];
          return (
            <Pressable
              key={opt.optionKey}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel={opt.description ? `${opt.label}. ${opt.description}` : opt.label}
              onPress={() => {
                if (saveError) setSaveError(null);
                setPledgesAccepted((prev) => ({
                  ...prev,
                  [opt.optionKey]: !isChecked,
                }));
              }}
              style={[styles.pledgeCard, isChecked && styles.pledgeCardChecked]}
            >
              <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                {isChecked && <AppIcon color={colors.surface} name="check" size={14} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pledgeLabel}>{opt.label}</Text>
                {opt.description ? <Text style={styles.pledgeDesc}>{opt.description}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Master Accept Button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setSaveError(null);
          const allTrue: Record<string, boolean> = {};
          stepConfig?.options.forEach((opt) => {
            allTrue[opt.optionKey] = true;
          });
          setPledgesAccepted(allTrue);
        }}
        style={styles.masterPledgeBtn}
      >
        <AppIcon color={colors.primary} name="check" size={16} />
        <Text style={styles.masterPledgeBtnText}>Accept All Community Guidelines</Text>
      </Pressable>
    </View>
  );
}
