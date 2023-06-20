import React from "react";
import { CasesBox } from "./cases-box/cases-box";
import { InformationBox } from "./information-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { useReleasesMasterData } from "../releases-types";
import { SharerControlBox } from "./sharer-control-box/sharer-control-box";
import { AccessBox } from "./access-box/access-box";
import { Box } from "../../../components/boxes";
import { useEnvRelay } from "../../../providers/env-relay-provider";
import { FEATURE_RELEASE_CONSENT_DISPLAY } from "@umccr/elsa-constants";

/**
 * The sub-page display the main details a single
 * specific release.
 */
export const ReleasesDetailSubPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  const { features } = useEnvRelay();

  const pageSize = usePageSizer();

  const releaseIsActivated = !!releaseData.activation;

  return (
    <>
      <InformationBox releaseKey={releaseKey} releaseData={releaseData} />

      <CasesBox
        releaseKey={releaseKey}
        datasetMap={releaseData.datasetMap}
        isEditable={releaseData.permissionEditSelections || false}
        pageSize={pageSize}
        releaseIsActivated={releaseIsActivated}
        showConsent={features.has(FEATURE_RELEASE_CONSENT_DISPLAY)}
      />

      {releaseData.permissionEditSelections && (
        <FurtherRestrictionsBox
          releaseKey={releaseKey}
          releaseData={releaseData}
        />
      )}

      {releaseData.permissionEditSelections && (
        <SharerControlBox releaseKey={releaseKey} releaseData={releaseData} />
      )}

      {/* until the release is activated - there is no point in showing the access box */}
      {releaseData.permissionAccessData && releaseIsActivated && (
        <AccessBox releaseKey={releaseKey} releaseData={releaseData} />
      )}
    </>
  );
};
