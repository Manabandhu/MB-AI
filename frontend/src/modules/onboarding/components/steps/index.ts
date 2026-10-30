import { CompleteStep } from './CompleteStep';
import { GoalsStep } from './GoalsStep';
import { InterestsStep } from './InterestsStep';
import { LanguagesStep } from './LanguagesStep';
import { LocationStep } from './LocationStep';
import { NotificationsStep } from './NotificationsStep';
import { ProfilePhotoStep } from './ProfilePhotoStep';
import { TrustStep } from './TrustStep';
import type { StepProps } from './types';

/** Step views in flow order; `STEP_VIEWS[meta.index - 1]` renders the current step. */
export const STEP_VIEWS: ((props: StepProps) => React.JSX.Element)[] = [
  GoalsStep,
  LocationStep,
  LanguagesStep,
  InterestsStep,
  ProfilePhotoStep,
  NotificationsStep,
  TrustStep,
  CompleteStep,
];
