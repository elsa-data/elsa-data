import React, { ReactNode } from "react";
import classNames from "classnames";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "../shared-types";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../queries";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const FurtherRestrictionsBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // whenever we do a mutation of application coded data - our API returns the complete updated
      // state of the *whole* release - and we can use that data to replace the stored react-query state
      onSuccess: (result: ReleaseTypeLocal) => {
        queryClient.setQueryData(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
          result
        );
      },
    }
  );

  const isAllowedCheck = (
    label: ReactNode,
    path:
      | "/allowedRead"
      | "/allowedVariant"
      | "/allowedPhenotype"
      | "/allowedS3"
      | "/allowedGS"
      | "/allowedR2"
      | "/allowedHtsget"
      | null,
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
                  "Phenotypes (e.g. FHIR, Phenopackets) (currently disabled)",
                  null,
                  false
                )}
              </RhChecks>
            </div>
            <div className="divider divider-horizontal"></div>
            <div className="grid flex-grow">
              <RhChecks label="By Data Location">
                {isAllowedCheck(
                  <>
                    AWS S3 (<span className="font-mono">s3://...</span>)
                  </>,
                  "/allowedS3",
                  releaseData.isAllowedS3Data
                )}
                {isAllowedCheck(
                  <>
                    Google GCP (<span className="font-mono">gs://...</span>)
                  </>,
                  "/allowedGS",
                  releaseData.isAllowedGSData
                )}
                {isAllowedCheck(
                  <>
                    CloudFlare R2 (<span className="font-mono">r2://...</span>)
                  </>,
                  "/allowedR2",
                  releaseData.isAllowedR2Data
                )}
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
            {isAllowedCheck("Presigned URLs (always enabled)", null, true)}
            {!releaseData.isHtsgetEnabledInConfig
              ? isAllowedCheck("htsget (disabled in config)", null, false)
              : isAllowedCheck(
                  "htsget",
                  "/allowedHtsget",
                  releaseData.isAllowedHtsget
                )}
          </RhChecks>
        </RightDiv>
      </div>
    </Box>
  );
};
