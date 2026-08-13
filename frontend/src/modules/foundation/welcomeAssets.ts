import type { ImageSourcePropType } from 'react-native';

import { welcomeStepIds } from '@/modules/foundation/foundationConstants';

export const welcomeLogo = require('../../../assets/images/welcome/manabandhu-logo.jpg');

const welcomeStepImages: Record<string, ImageSourcePropType> = {
  [welcomeStepIds.findHelp]: require('../../../assets/images/welcome/community-services.jpg'),
  [welcomeStepIds.trustedCommunity]: require('../../../assets/images/welcome/trusted-neighborhood.jpg'),
  [welcomeStepIds.everydayLife]: require('../../../assets/images/welcome/community-services.jpg'),
  [welcomeStepIds.getStarted]: welcomeLogo,
};

export function welcomeImageSource(stepId: string, remoteUrl?: string): ImageSourcePropType {
  return welcomeStepImages[stepId] ?? (remoteUrl ? { uri: remoteUrl } : welcomeLogo);
}
