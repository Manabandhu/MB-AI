import { color as colors, typography } from '@manabandhu/design-system';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme } from 'react-native';

export type CountdownTimerProps = {
  seconds: number;
  onFinish?: () => void;
  label?: string;
};

export function CountdownTimer({ seconds, onFinish, label = 'Resend in' }: CountdownTimerProps) {
  const colorScheme = useColorScheme();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onFinish?.();
      return;
    }
    const timer = setInterval(() => setRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining, onFinish]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>
      {label} {minutes}:{secs.toString().padStart(2, '0')}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  labelDark: { color: colors.muted },
});
