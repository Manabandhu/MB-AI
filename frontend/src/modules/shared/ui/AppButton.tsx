import { motion } from '@manabandhu/design-system';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { ActivityIndicator, Platform } from 'react-native';
import { styled, Theme, useTheme, XStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type AppButtonSize = 'sm' | 'md' | 'lg';

type AppButtonProps = {
  label: string;
  route?: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: AppIconName;
  iconAfter?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

const Frame = styled(XStack, {
  name: 'AppButton',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$x2',
  borderRadius: '$control',
  borderWidth: 1,
  cursor: 'pointer',
  focusVisibleStyle: { outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' },
  variants: {
    variant: {
      primary: { backgroundColor: '$primary', borderColor: '$primary' },
      danger: { backgroundColor: '$error', borderColor: '$error' },
      secondary: {
        backgroundColor: '$primaryTint',
        borderColor: '$primarySoft',
        hoverStyle: { backgroundColor: '$surfaceContainer' },
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        hoverStyle: { backgroundColor: '$primaryTint' },
      },
    },
    size: {
      sm: { minHeight: 36, paddingHorizontal: '$x3' },
      md: { minHeight: '$touch', paddingHorizontal: '$x4' },
      lg: { minHeight: '$control', paddingHorizontal: '$x6' },
    },
    fullWidth: { true: { alignSelf: 'stretch' } },
    disabled: { true: { opacity: 0.5, cursor: 'not-allowed' } },
  } as const,
  defaultVariants: { variant: 'primary', size: 'md' },
});

/** The app's one button. Springs to `motion.pressScale` on press (skipped with reduced motion) and taps a haptic. */
export function AppButton({
  label,
  route,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  loading,
  disabled,
  fullWidth,
}: AppButtonProps) {
  const { reduceMotion } = useAppearance();
  const theme = useTheme();
  const solid = variant === 'primary' || variant === 'danger';
  const foreground = solid ? theme.onPrimary?.val : theme.primary?.val;
  const isDisabled = Boolean(loading || disabled);

  const handlePress = () => {
    if (isDisabled) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
    if (onPress) onPress();
    else if (route) router.push(route as Href);
  };

  return (
    <Frame
      aria-label={label}
      role="button"
      aria-busy={Boolean(loading)}
      aria-disabled={isDisabled}
      transition={reduceMotion ? null : 'quick'}
      disabled={isDisabled}
      focusable={!isDisabled}
      fullWidth={fullWidth}
      onPress={handlePress}
      pressStyle={reduceMotion ? { opacity: 0.85 } : { scale: motion.pressScale, opacity: 0.95 }}
      size={size}
      variant={variant}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : icon ? (
        <AppIcon color={foreground} name={icon} size={size === 'sm' ? 16 : 18} />
      ) : null}
      <AppText
        numberOfLines={1}
        style={{ color: foreground }}
        variant={size === 'sm' ? 'label' : 'bodyStrong'}
      >
        {label}
      </AppText>
      {iconAfter && !loading ? (
        <AppIcon color={foreground} name={iconAfter} size={size === 'sm' ? 16 : 18} />
      ) : null}
    </Frame>
  );
}

/** Renders children in an accent sub-theme (`primary`, `teal`, `warm`, `danger`). */
export { Theme as AccentTheme };
