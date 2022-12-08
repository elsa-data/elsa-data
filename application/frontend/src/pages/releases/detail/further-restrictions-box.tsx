import React from "react";
import classNames from "classnames";
import { useMutation, useQueryClient } from "react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "./queries";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const FurtherRestrictionsBox: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseId}`),
    {
      // whenever we do a mutation of application coded data - our API returns the complete updated
      // state of the *whole* release - and we can use that data to replace the stored react-query state
      onSuccess: (result: ReleaseTypeLocal) => {
        queryClient.setQueryData(
          REACT_QUERY_RELEASE_KEYS.detail(releaseId),
          result
        );
      },
    }
  );

  const isAllowedCheck = (
    label: string,
    path: "/allowedRead" | "/allowedVariant" | "/allowedPhenotype" | null,
    current: boolean
  ) => (
    <RhCheckItem
      label={label}
      checked={current}
      disabled={!path}
      className={classNames({ "opacity-50": releasePatchMutate.isLoading })}
      onChange={(e) => {
        if (path) {
          releasePatchMutate.mutate({
            op: "replace",
            path: path,
            value: !current,
          });
        }
      }}
    />
  );

  return (
    <Box heading="Further Restrictions">
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Allowed Data"}
          extra={
            "Access can be restricted to different types of data based on the requirements of the study"
          }
        />
        <RightDiv>
          <RhChecks label="Allow Access To">
            {isAllowedCheck("Manifest (always allowed)", null, true)}
            {isAllowedCheck(
              "Read Data (e.g. BAM, CRAM, FASTQ, ORA)",
              "/allowedRead",
              releaseData.isAllowedReadData
            )}
            {isAllowedCheck(
              "Variant Data (e.g. VCF)",
              "/allowedVariant",
              releaseData.isAllowedVariantData
            )}
            {isAllowedCheck(
              "Phenotype Data (e.g. FHIR, Phenopackets)",
              "/allowedPhenotype",
              releaseData.isAllowedPhenotypeData
            )}
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
