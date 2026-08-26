import { color, space, typography } from '@manabandhu/design-system';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function JobsFiltersScreen() {
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');

  return (
    <ScreenShell>
      <SectionHeader title="Job filters" subtitle="Refine your job search." />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <Input>
            <InputField placeholder="City or remote" value={location} onChangeText={setLocation} />
          </Input>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Job type</Text>
          <Input>
            <InputField
              placeholder="Full-time, part-time, contract"
              value={type}
              onChangeText={setType}
            />
          </Input>
        </View>
        <View style={styles.actions}>
          <AppButton label="Apply filters" route="/jobs/search" />
          <AppButton
            label="Reset"
            variant="secondary"
            onPress={() => {
              setLocation('');
              setType('');
            }}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.x4, marginTop: space.x4 },
  field: { gap: space.x2 },
  label: {
    color: color.ink,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x4 },
});
