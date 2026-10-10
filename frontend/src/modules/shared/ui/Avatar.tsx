import { Image } from 'expo-image';
import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';

const sizes = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

type AvatarProps = { name: string; imageUrl?: string | null; size?: keyof typeof sizes };

/** Member photo, or their initials on the brand colour when there is no photo. */
export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const px = sizes[size];
  return (
    <YStack
      aria-label={name}
      role="img"
      alignItems="center"
      backgroundColor="$primary"
      borderRadius="$pill"
      height={px}
      justifyContent="center"
      overflow="hidden"
      width={px}
    >
      {imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={{ width: px, height: px }}
          transition={150}
        />
      ) : (
        <AppText
          color="$onPrimary"
          fontSize={Math.round(px * 0.38)}
          fontWeight="800"
          lineHeight={Math.round(px * 0.5)}
        >
          {initials(name)}
        </AppText>
      )}
    </YStack>
  );
}
