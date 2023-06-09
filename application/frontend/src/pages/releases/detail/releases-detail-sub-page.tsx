import React from "react";
import { CasesBox } from "./cases-box/cases-box";
import { InformationBox } from "./information-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { useReleasesMasterData } from "../releases-types";
import { SharerControlBox } from "./sharer-control-box/sharer-control-box";
import { AccessBox } from "./access-box/access-box";

/**
 * The sub-page display the main details a single
 * specific release.
 */
export const ReleasesDetailSubPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  const pageSize = usePageSizer();

  return (
    <>
      <InformationBox releaseKey={releaseKey} releaseData={releaseData} />

      <CasesBox
        releaseKey={releaseKey}
        datasetMap={releaseData.datasetMap}
        isEditable={releaseData.permissionEditSelections || false}
        pageSize={pageSize}
        releaseIsActivated={!!releaseData.activation}
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

      {releaseData.permissionAccessData && (
        <AccessBox releaseKey={releaseKey} releaseData={releaseData} />
      )}
    </>
  );
};
