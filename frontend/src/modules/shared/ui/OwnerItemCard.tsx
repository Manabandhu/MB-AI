import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { Children, type ReactNode, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

const THUMB_SIZE = 72;
/** Inline actions shown on the card; anything else belongs in `overflow`. */
const MAX_INLINE_ACTIONS = 2;
const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

export type OwnerItemOverflowAction = {
  label: string;
  icon?: AppIconName;
  onPress: () => void;
  /** Shown in the danger colour (delete, cancel, remove). Still confirm with `useConfirm`. */
  destructive?: boolean;
};

type OwnerItemCardProps = {
  /** Usually a `StatusBadge`. */
  status?: ReactNode;
  /** Short trailing text on the top row, such as a price. */
  trailing?: string;
  title: string;
  /** Facts joined with " · " (location, dates, counts). */
  meta?: string[];
  /** One more line, e.g. why the item is hidden. */
  note?: string;
  imageUrl?: string | null;
  href?: Href;
  onPress?: () => void;
  /** At most two inline `AppButton size="sm"`s; extra children are dropped. */
  actions?: ReactNode;
  /** Secondary actions listed in a sheet behind a "More" button. */
  overflow?: OwnerItemOverflowAction[];
};

/**
 * A row in an owner's own list (my listings, my rides): status and price, title, meta, note, up to two inline
 * actions, and a "More" sheet for the rest. The card itself opens the item.
 */
export function OwnerItemCard({
  status,
  trailing,
  title,
  meta,
  note,
  imageUrl,
  href,
  onPress,
  actions,
  overflow,
}: OwnerItemCardProps) {
  const { palette } = useAppearance();
  const [menuOpen, setMenuOpen] = useState(false);
  const inline = Children.toArray(actions).slice(0, MAX_INLINE_ACTIONS);
  const metaText = (meta ?? []).filter(Boolean).join(' · ');
  const hasOverflow = Boolean(overflow?.length);
  const pressable = Boolean(href || onPress);
  const open = () => {
    if (onPress) onPress();
    else if (href) router.push(href);
  };

  return (
    <>
      <Card gap={0} overflow="hidden" padding={0}>
        {/* Only the summary is pressable; the actions row is a sibling so its presses never open the item. */}
        <XStack
          aria-label={[title, trailing, metaText].filter(Boolean).join(', ')}
          cursor={pressable ? 'pointer' : undefined}
          focusVisibleStyle={pressable ? focusRing : undefined}
          focusable={pressable}
          gap="$x3"
          hoverStyle={pressable ? { backgroundColor: '$surfaceContainerLow' } : undefined}
          onPress={pressable ? open : undefined}
          padding="$x3"
          pressStyle={pressable ? { backgroundColor: '$surfaceContainer' } : undefined}
          role={pressable ? (href ? 'link' : 'button') : undefined}
        >
          {imageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: imageUrl }}
              style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 }}
            />
          ) : null}
          <YStack flex={1} gap="$x1" minWidth={0}>
            {status || trailing ? (
              <XStack alignItems="center" gap="$x2" justifyContent="space-between">
                <XStack flexShrink={1}>{status}</XStack>
                {trailing ? (
                  <AppText numberOfLines={1} tone="primary" variant="bodyStrong">
                    {trailing}
                  </AppText>
                ) : null}
              </XStack>
            ) : null}
            <AppText numberOfLines={2} variant="bodyStrong">
              {title}
            </AppText>
            {metaText ? (
              <AppText numberOfLines={2} tone="muted" variant="caption">
                {metaText}
              </AppText>
            ) : null}
            {note ? (
              <AppText numberOfLines={3} tone="muted" variant="caption">
                {note}
              </AppText>
            ) : null}
          </YStack>
        </XStack>
        {inline.length || hasOverflow ? (
          <XStack
            alignItems="center"
            flexWrap="wrap"
            gap="$x2"
            paddingBottom="$x3"
            paddingHorizontal="$x3"
          >
            {inline}
            {hasOverflow ? (
              <XStack marginLeft="auto">
                <IconButton
                  icon="more"
                  label={`More actions for ${title}`}
                  onPress={() => setMenuOpen(true)}
                  variant="plain"
                />
              </XStack>
            ) : null}
          </XStack>
        ) : null}
      </Card>
      {hasOverflow ? (
        <BottomSheet onClose={() => setMenuOpen(false)} scrollable title={title} visible={menuOpen}>
          <YStack paddingBottom="$x2">
            {overflow?.map((item) => {
              const color = item.destructive ? palette.error : palette.ink;
              return (
                <XStack
                  alignItems="center"
                  aria-label={item.label}
                  borderRadius="$control"
                  cursor="pointer"
                  focusVisibleStyle={focusRing}
                  focusable
                  gap="$x3"
                  hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
                  key={item.label}
                  minHeight="$touch"
                  onPress={() => {
                    setMenuOpen(false);
                    item.onPress();
                  }}
                  {...keyboardPress(() => {
                    setMenuOpen(false);
                    item.onPress();
                  })}
                  paddingHorizontal="$x2"
                  pressStyle={{ backgroundColor: '$surfaceContainer' }}
                  role="button"
                >
                  {item.icon ? <AppIcon color={color} name={item.icon} size={20} /> : null}
                  <AppText color={item.destructive ? '$error' : '$color'} variant="bodyStrong">
                    {item.label}
                  </AppText>
                </XStack>
              );
            })}
          </YStack>
        </BottomSheet>
      ) : null}
    </>
  );
}
