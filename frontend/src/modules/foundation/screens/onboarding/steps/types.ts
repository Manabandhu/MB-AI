import type { OnboardingStyles, Palette } from '../styles';
import type { OnboardingFlow } from '../useOnboardingFlow';

export type StepProps = { flow: OnboardingFlow; styles: OnboardingStyles; colors: Palette };
