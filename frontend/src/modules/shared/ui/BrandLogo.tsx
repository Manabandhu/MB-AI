import { brand } from '@manabandhu/design-system';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';

type BrandLogoProps = {
  /** `mark` is the app-icon tile; `wordmark` adds the "ManaBandhu" name beside it. */
  variant?: 'mark' | 'wordmark';
  size?: number;
};

/** Vector ManaBandhu logo. Source artwork lives in `frontend/assets/brand/*.svg`; keep the two in sync. */
export function BrandMark({ size = 40 }: { size?: number }) {
  const [start, mid, end] = brand.gradient;
  return (
    <YStack aria-label={brand.name} height={size} role="img" width={size}>
      <Svg height={size} viewBox="0 0 1024 1024" width={size}>
        <Defs>
          <LinearGradient id="mbTile" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={start} />
            <Stop offset="0.45" stopColor={mid} />
            <Stop offset="1" stopColor={end} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#mbTile)" height={1024} rx={232} width={1024} />
        <Path
          d="M276 744V518a118 118 0 0 1 236 0v226M512 744V518a118 118 0 0 1 236 0v226"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={96}
        />
        <Circle cx={512} cy={280} fill={brand.color.accent} r={62} />
      </Svg>
    </YStack>
  );
}

export function BrandLogo({ variant = 'mark', size = 40 }: BrandLogoProps) {
  if (variant === 'mark') return <BrandMark size={size} />;
  return (
    <XStack aria-label={brand.name} role="img" alignItems="center" gap={size * 0.28}>
      <BrandMark size={size} />
      <AppText fontSize={size * 0.55} fontWeight="800" letterSpacing={-0.5} lineHeight={size * 0.7}>
        Mana
        <AppText color="$primary" fontSize={size * 0.55} fontWeight="800" lineHeight={size * 0.7}>
          Bandhu
        </AppText>
      </AppText>
    </XStack>
  );
}
