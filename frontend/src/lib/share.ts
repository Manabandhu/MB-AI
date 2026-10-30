import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

/** Public web origin used in shared links (set `EXPO_PUBLIC_WEB_URL` per environment). */
const webOrigin = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');

/**
 * Link to a screen that opens the app when installed: the public web URL when configured (universal/App Links),
 * otherwise the app scheme on native and the current origin on web.
 */
export function linkTo(path: string): string {
  if (webOrigin) return `${webOrigin}${path}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `${window.location.origin}${path}`;
  return Linking.createURL(path);
}

/**
 * Opens the system share sheet (Web Share API in browsers, falling back to the clipboard). Returns how the link was
 * shared so the caller can confirm it to the member.
 */
export async function shareLink(
  path: string,
  message: string,
): Promise<'shared' | 'copied' | 'dismissed'> {
  const url = linkTo(path);
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ text: message, url });
        return 'shared';
      } catch {
        return 'dismissed';
      }
    }
    if (nav?.clipboard) {
      await nav.clipboard.writeText(`${message} ${url}`);
      return 'copied';
    }
    return 'dismissed';
  }
  const result = await Share.share(
    Platform.OS === 'ios' ? { message, url } : { message: `${message} ${url}` },
  );
  return result.action === Share.sharedAction ? 'shared' : 'dismissed';
}
