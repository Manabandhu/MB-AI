import { type Href, router } from 'expo-router';
import { XStack } from 'tamagui';
import { IconButton } from './IconButton';

/** Back control for stack screens without a native header; falls back to `fallback` when there is no history. */
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  return (
    <XStack>
      <IconButton
        icon="chevron-left"
        label="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as Href))}
        variant="plain"
      />
    </XStack>
  );
}
