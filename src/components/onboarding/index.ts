/**
 * Onboarding Components
 *
 * This module exports all onboarding-related components for the AquaBotAI platform.
 */

// Original onboarding wizard (tank setup flow)
export { OnboardingWizard } from "./onboarding-wizard";

// AI-powered onboarding questionnaire
export {
  AIOnboardingWizard,
  type OnboardingState,
  type ExperienceLevel,
  type CurrentSituation,
  type PrimaryGoal,
  type Challenge,
} from "./ai-onboarding-wizard";
