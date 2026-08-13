import { fallbackWelcomeFlow } from '@/modules/foundation/foundationConstants';
import type { WelcomeFlow, WelcomeStep } from '@/modules/foundation/welcomeTypes';

export function getWelcomeSteps(flow?: WelcomeFlow): WelcomeStep[] {
  return flow?.steps.length ? flow.steps : fallbackWelcomeFlow.steps;
}

export function clampWelcomeStepIndex(index: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.min(Math.max(index, 0), totalSteps - 1);
}

export function isFinalWelcomeStep(index: number, totalSteps: number): boolean {
  return index === Math.max(totalSteps - 1, 0);
}
