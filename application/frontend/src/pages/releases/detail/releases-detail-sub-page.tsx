import React from "react";
import { CasesBox } from "./cases-box/cases-box";
import { InformationBox } from "./information-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { useReleasesMasterData } from "../releases-types";
import { SharerControlBox } from "./sharer-control-box/sharer-control-box";
import { AccessBox } from "./access-box/access-box";
import { useEnvRelay } from "../../../providers/env-relay-provider";
import { FEATURE_RELEASE_CONSENT_DISPLAY } from "../../../../../backend/src/shared/constants-features";

/**
 * The sub-page display the main details a single
 * specific release.
 */
export const ReleasesDetailSubPage: React.FC = () => {
  const { releaseKey, releaseData, releaseDataIsLoading } =
    useReleasesMasterData();

  // feature
  const { features } = useEnvRelay();

  // we have switched off consent display entirely whislt it is being rebuilt - but this
  // boolean should be re-inserted to the CasesBox when safe
  features.has(FEATURE_RELEASE_CONSENT_DISPLAY);

  const pageSize = usePageSizer();

  const releaseIsActivated = !!releaseData.activation;

  return (
    <>
      <InformationBox
        releaseKey={releaseKey}
        releaseData={releaseData}
        releaseDataIsLoading={releaseDataIsLoading}
      />

      <CasesBox
        releaseKey={releaseKey}
        datasetMap={releaseData.datasetMap}
        isAllowEdit={releaseData.permissionEditSelections ?? false}
        isAllowAdminView={releaseData.permissionViewSelections ?? false}
        pageSize={pageSize}
        releaseIsActivated={releaseIsActivated}
        showConsent={true}
      />

      {releaseData.permissionViewSelections && (
        <FurtherRestrictionsBox
          releaseKey={releaseKey}
          releaseData={releaseData}
          isAllowEdit={releaseData.permissionEditSelections ?? false}
        />
      )}

      {releaseData.permissionViewSelections && (
        <SharerControlBox
          releaseKey={releaseKey}
          releaseData={releaseData}
          isAllowEdit={releaseData.permissionEditSelections ?? false}
        />
      )}

      {/* until the release is activated - there is no point in showing the access box */}
      {releaseData.permissionAccessData && releaseIsActivated && (
        <AccessBox releaseKey={releaseKey} releaseData={releaseData} />
      )}
    </>
  );
};
