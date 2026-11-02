import { brand, categoryFor } from '@manabandhu/design-system';
import { type Href, router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { GradientSurface } from '@/modules/shared/ui/GradientSurface';
import { Floating } from '@/modules/shared/ui/motion/Floating';
import { PressableScale } from '@/modules/shared/ui/motion/PressableScale';
import { PromoCarousel } from '@/modules/shared/ui/PromoCarousel';

type Promo = {
  key: 'rooms' | 'rides' | 'referrals' | 'events';
  icon: AppIconName;
  route: Href;
  title:
    | 'home.promoRoomTitle'
    | 'home.promoRideTitle'
    | 'home.promoReferralTitle'
    | 'home.promoEventTitle';
  body:
    | 'home.promoRoomBody'
    | 'home.promoRideBody'
    | 'home.promoReferralBody'
    | 'home.promoEventBody';
};

/** Calls to action, not data: each banner opens the real create flow of its module. */
const PROMOS: Promo[] = [
  {
    key: 'rooms',
    icon: 'bed',
    route: '/rooms/create-listing',
    title: 'home.promoRoomTitle',
    body: 'home.promoRoomBody',
  },
  {
    key: 'rides',
    icon: 'car',
    route: '/rides/offer',
    title: 'home.promoRideTitle',
    body: 'home.promoRideBody',
  },
  {
    key: 'referrals',
    icon: 'handshake',
    route: '/referrals/request',
    title: 'home.promoReferralTitle',
    body: 'home.promoReferralBody',
  },
  {
    key: 'events',
    icon: 'event',
    route: '/events/create',
    title: 'home.promoEventTitle',
    body: 'home.promoEventBody',
  },
];

const onBrand = brand.color.onPrimary;
const glass = brand.color.onPrimaryGlass;

function PromoBanner({ promo }: { promo: Promo }) {
  const t = useT();
  const colors = categoryFor(promo.key);
  const title = t(promo.title);
  return (
    <PressableScale
      aria-label={`${title}. ${t(promo.body)}`}
      onPress={() => router.push(promo.route)}
      role="link"
    >
      <GradientSurface colors={[colors.from, colors.to]} padding={0} radius={24}>
        <XStack alignItems="center" gap="$x4" minHeight={148} padding="$x5">
          <YStack flex={1} gap="$x2">
            <AppText color={onBrand} numberOfLines={1} variant="h3">
              {title}
            </AppText>
            <AppText color={onBrand} numberOfLines={3} opacity={0.92} variant="label">
              {t(promo.body)}
            </AppText>
            <XStack
              alignItems="center"
              alignSelf="flex-start"
              backgroundColor={onBrand}
              borderRadius="$pill"
              gap={4}
              marginTop="$x1"
              paddingHorizontal="$x3"
              paddingVertical={6}
            >
              <AppText color={colors.to} fontWeight="800" variant="caption">
                {t('home.promoCta')}
              </AppText>
              <AppIcon color={colors.to} name="chevron-right" size={14} />
            </XStack>
          </YStack>
          <Floating distance={5}>
            <YStack
              alignItems="center"
              backgroundColor={glass}
              borderRadius={28}
              height={76}
              justifyContent="center"
              rotate="-8deg"
              width={76}
            >
              <AppIcon color={onBrand} name={promo.icon} size={36} strokeWidth={1.8} />
            </YStack>
          </Floating>
        </XStack>
      </GradientSurface>
    </PressableScale>
  );
}

/** Paytm-style banner rail on Home: swipeable, auto-advancing, with scroll-linked dots. */
export function HomePromos() {
  return (
    <PromoCarousel
      items={PROMOS}
      keyOf={(promo) => promo.key}
      label="Get started"
      renderItem={(promo) => <PromoBanner promo={promo} />}
    />
  );
}
