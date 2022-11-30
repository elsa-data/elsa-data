import React from "react";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import { HrDiv, LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const FutherRestrictionsBox: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  return (
    <Box heading="Further Restrictions">
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Allowed File Types"}
          extra={
            "Access may be restricted to only certain types of data files depending on whether the study has need for read data or just variants (for instance)"
          }
        />
        <RightDiv>
          <RhChecks label="Allow Access to Data">
            <RhCheckItem label="Manifests" checked={true} />
            <RhCheckItem label="Reads" />
            <RhCheckItem label="Variants" />
            <RhCheckItem label="Phenotypes" />
          </RhChecks>
        </RightDiv>
      </div>
      {/*} <HrDiv />
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Allowed File Roles"}
          extra={
            "Access may be restricted to only those files playing a specific role in a patients care"
          }
        />
        <RightDiv>
          <RhChecks label="File roles">
            <RhCheckItem label="Germline" />
            <RhCheckItem label="Somatic" />
          </RhChecks>
        </RightDiv>
      </div>
      <HrDiv />
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Allowed Access Mechanisms"}
          extra={
            "Access mechanisms may be restricted to only those included in data transfer agreements"
          }
        />
        <RightDiv>
          <RhChecks label="Access">
            <RhCheckItem label="S3" />
            <RhCheckItem label="htsget" />
            <RhCheckItem label="DRS" />
          </RhChecks>
        </RightDiv>
      </div> */}
    </Box>
  );
};
