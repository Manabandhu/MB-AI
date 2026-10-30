import { space } from '@manabandhu/design-system';
import { Platform, Switch, Text, View } from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { resolveAppIcon } from '../stepMeta';
import type { StepProps } from './types';

/** Step 6: Notifications */
export function NotificationsStep({ flow, styles, colors }: StepProps) {
  const { notificationPreferences, setNotificationPreferences, stepConfig } = flow;
  return (
    <View style={styles.stepContainer}>
      <View style={styles.notificationList}>
        {stepConfig?.options.map((opt) => {
          const isEnabled = !!notificationPreferences[opt.optionKey];
          return (
            <View key={opt.optionKey} style={styles.notificationRow}>
              <View style={styles.notificationIconBox}>
                <AppIcon
                  color={colors.primary}
                  name={resolveAppIcon(opt.iconName || opt.category)}
                  size={20}
                />
              </View>
              <View style={{ flex: 1, paddingRight: space.x2 }}>
                <Text style={styles.notificationTitle}>{opt.label}</Text>
                {opt.description ? (
                  <Text style={styles.notificationDesc}>{opt.description}</Text>
                ) : null}
              </View>
              <Switch
                onValueChange={(val) => {
                  setNotificationPreferences((prev) => ({
                    ...prev,
                    [opt.optionKey]: val,
                  }));
                }}
                thumbColor={Platform.OS === 'android' ? colors.surface : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
                value={isEnabled}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
