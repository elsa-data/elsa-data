import {
  FEATURE_DEV_TEST_USERS_LOGIN,
  FEATURE_RELEASE_COHORT_CONSTRUCTOR,
  FEATURE_RELEASE_CONSENT_DISPLAY,
  FEATURE_RELEASE_DATA_EGRESS_VIEWER,
} from "@umccr/elsa-constants";
import { ElsaSettings } from "./config/elsa-settings";
import { DependencyContainer } from "tsyringe";

/**
 * Determine on startup which features are enabled in this Elsa Data instance.
 *
 * This could be due to config settings, or could be because of the presence
 * of installed tool/services.
 *
 * @param container a dependency container for resolving services
 * @param settings the application settings
 */
export async function getFeaturesEnabled(
  container: DependencyContainer,
  settings: ElsaSettings,
): Promise<Set<string>> {
  const featuresEnabled = new Set<string>();

  if (settings.feature) {
    if (settings.feature.enableCohortConstructor)
      featuresEnabled.add(FEATURE_RELEASE_COHORT_CONSTRUCTOR);

    if (settings.feature.enableDataEgressViewer)
      featuresEnabled.add(FEATURE_RELEASE_DATA_EGRESS_VIEWER);

    if (settings.feature.enableConsentDisplay)
      featuresEnabled.add(FEATURE_RELEASE_CONSENT_DISPLAY);
  }

  // allowTestUsers makes some special purpose users and routes that allow direct login
  if (settings.devTesting && settings.devTesting.allowTestUsers)
    featuresEnabled.add(FEATURE_DEV_TEST_USERS_LOGIN);

  return featuresEnabled;
}
