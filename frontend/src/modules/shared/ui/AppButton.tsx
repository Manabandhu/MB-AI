import { color as colors } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
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
};

export function AppButton({
  label,
  route,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const gluestackVariant = isPrimary ? 'default' : variant === 'secondary' ? 'outline' : 'ghost';
  const textColor = isPrimary ? colors.surface : colors.primary;

  return (
    <Button
      className="min-h-12 rounded-xl px-4"
      onPress={onPress ?? (() => route && router.push(route as Href))}
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
  );
}
