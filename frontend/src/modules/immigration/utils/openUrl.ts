import { Linking } from 'react-native';
import { showError } from '@/modules/shared/ui/notify';

/** Opens an external http(s) link; anything else is refused rather than handed to the OS. */
export async function openUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    showError('Unable to open link', 'This link is not a web address.');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch (error) {
    showError('Unable to open link', error);
  }
}
