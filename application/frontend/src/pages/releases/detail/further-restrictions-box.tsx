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
      disabled={!path || !!releaseData.activation}
      className={classNames({ "opacity-50": releasePatchMutate.isLoading })}
      inputClassName={"checkbox-accent"}
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
    <Box heading="Sharing" applyIsLockedStyle={!!releaseData.activation}>
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Data"}
          extra={
            "Access can be restricted to different types of data based on the requirements of the study"
          }
        />
        <RightDiv>
          <div className="flex w-full">
            <div className="grid flex-grow">
              <RhChecks label="By Data Type">
                {isAllowedCheck("Manifest (always allowed)", null, true)}
                {isAllowedCheck(
                  "Reads (e.g. BAM, CRAM, FASTQ, ORA)",
                  "/allowedRead",
                  releaseData.isAllowedReadData
                )}
                {isAllowedCheck(
                  "Variants (e.g. VCF)",
                  "/allowedVariant",
                  releaseData.isAllowedVariantData
                )}
                {isAllowedCheck(
                  "Phenotypes (e.g. FHIR, Phenopackets)",
                  "/allowedPhenotype",
                  releaseData.isAllowedPhenotypeData
                )}
              </RhChecks>
            </div>
            <div className="divider divider-horizontal"></div>
            <div className="grid flex-grow">
              <RhChecks label="By Data Location">
                {isAllowedCheck("AWS S3 (s3://...)", null, true)}
                {isAllowedCheck("Google GCP (gs://...)", null, true)}
                {isAllowedCheck("CloudFlare R2 (r2://...)", null, true)}
              </RhChecks>
            </div>
          </div>
        </RightDiv>
        <LeftDiv
          heading={"Mechanism"}
          extra={
            "The technical mechanisms by which data can be accessed can be restricted according to data transfer agreements and organisation policy"
          }
        />
        <RightDiv>
          <RhChecks label="Access Via">
            {isAllowedCheck("Presigned URLs", null, true)}
            {isAllowedCheck("htsget", null, false)}
          </RhChecks>
        </RightDiv>
      </div>
    </Box>
  );
};
