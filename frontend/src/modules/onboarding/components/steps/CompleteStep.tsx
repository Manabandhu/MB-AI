import { Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { StepProps } from './types';

/** Step 8: Complete */
export function CompleteStep({ flow, styles, colors }: StepProps) {
  const { progress, selectedReasons, metroLocation, primaryLanguage, interestTags } = flow;
  return (
    <View style={styles.stepContainer}>
      <View style={styles.celebrationHero}>
        <View style={styles.sparkleCircle}>
          <AppIcon color={colors.warm} name="sparks" size={36} />
        </View>
        <Text style={styles.celebrateTitle}>You're all set</Text>
        <Text style={styles.celebrateSub}>
          Your preferences are saved. You can change them any time in Settings.
        </Text>
      </View>

      {/* Personalized Profile Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardTitle}>Your Personalized Profile</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Metro Area</Text>
          <Text style={styles.summaryValue}>{metroLocation || 'Not set'}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Primary Language</Text>
          <Text style={styles.summaryValue}>
            {primaryLanguage ? primaryLanguage.toUpperCase() : 'Not set'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Top Goals</Text>
          <Text style={styles.summaryValue}>
            {selectedReasons.length ? `${selectedReasons.length} selected` : 'None selected'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Community Interests</Text>
          <Text style={styles.summaryValue}>
            {interestTags.length ? `${interestTags.length} selected` : 'None selected'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Trust Pledge</Text>
          <Text
            style={[
              styles.summaryValue,
              progress?.safetyPledgeAccepted ? { color: colors.teal } : null,
            ]}
          >
            {progress?.safetyPledgeAccepted ? 'Agreed' : 'Not yet agreed'}
          </Text>
        </View>
      </View>
    </View>
  );
}
