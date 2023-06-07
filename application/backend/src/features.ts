import {
  FEATURE_RELEASE_COHORT_CONSTRUCTOR,
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
  settings: ElsaSettings
): Promise<Set<string>> {
  const featuresEnabled = new Set<string>();

  if (settings.feature) {
    if (settings.feature.enableCohortConstructor)
      featuresEnabled.add(FEATURE_RELEASE_COHORT_CONSTRUCTOR);

    if (settings.feature.enableDataEgressViewer)
      featuresEnabled.add(FEATURE_RELEASE_DATA_EGRESS_VIEWER);
  }

  // we want to do our feature discovery in a container context that goes away afterwards
  /*
  WE HAVE PIVOTED TO DOING SHARER DISCOVERY VIA AN EXPLICIT CONFIGURATION
  'sharer'. All of this discovery is performed on each login by a user.

  const childContainer = container.createChildContainer();

  if (await childContainer.resolve(AwsEnabledService).isEnabled()) {
    featuresEnabled.add(FEATURE_DATA_SHARING_AWS_ACCESS_POINT);

    // some AWS services need AWS + other things installed too
    if (
      await childContainer.resolve(AwsDiscoveryService).locateCopyOutStepsArn()
    ) {
      featuresEnabled.add(FEATURE_DATA_SHARING_COPY_OUT);
    }
  }

  if (await childContainer.resolve(GcpEnabledService).isEnabled()) {
    featuresEnabled.add(FEATURE_DATA_SHARING_GCP_IAM);
  }

  childContainer.dispose(); */

  return featuresEnabled;
}
