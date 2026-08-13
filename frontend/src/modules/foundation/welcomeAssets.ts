import type { ImageSourcePropType } from 'react-native';

export const welcomeLogo = require('../../../assets/images/welcome/manabandhu-logo.jpg');

const welcomeStepImages: Record<string, ImageSourcePropType> = {
  'find-help': require('../../../assets/images/welcome/community-services.jpg'),
  'trusted-community': require('../../../assets/images/welcome/trusted-neighborhood.jpg'),
  'everyday-life': require('../../../assets/images/welcome/community-services.jpg'),
  'get-started': welcomeLogo,
};

export function welcomeImageSource(stepId: string, remoteUrl?: string): ImageSourcePropType {
  return welcomeStepImages[stepId] ?? (remoteUrl ? { uri: remoteUrl } : welcomeLogo);
}
