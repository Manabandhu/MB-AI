import { color as colors } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Animated } from 'react-native';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { Button, ButtonText } from '@/modules/shared/ui/gluestack/button';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = {
  label: string;
  route?: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  icon?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function AppButton({
  label,
  route,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  testID,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const gluestackVariant = isPrimary ? 'default' : variant === 'secondary' ? 'outline' : 'ghost';
  const textColor = isPrimary ? colors.surface : colors.primary;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Button
        testID={testID}
        className="min-h-12 rounded-xl px-4"
        onPress={onPress ?? (() => route && router.push(route as Href))}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        variant={gluestackVariant}
        isDisabled={loading || disabled}
      >
        {icon ? <AppIcon color={textColor} name={icon} size={18} /> : null}
        <ButtonText
          className={isPrimary ? 'text-primary-foreground font-bold' : 'text-primary font-bold'}
        >
          {label}
        </ButtonText>
      </Button>
    </Animated.View>
  );
}
