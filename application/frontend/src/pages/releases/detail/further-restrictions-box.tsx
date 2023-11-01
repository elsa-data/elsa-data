import React, { useCallback, useState, ReactNode } from "react";
import classNames from "classnames";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "../shared-types";
import {
  LeftDiv,
  RhSection,
  RightDiv,
} from "../../../components/rh/rh-structural";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";
import { axiosPatchOperationMutationFn } from "../queries";
import { trpc } from "../../../helpers/trpc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { ReleaseSizeType } from "@umccr/elsa-types";
import { fileSize } from "humanize-plus";

const Stats = ({
  stats,
}: {
  stats:
    | {
        numObjects: number;
        numBytes: number;
      }
    | undefined;
}) => {
  const { numObjects = undefined, numBytes = undefined } = stats ?? {};

  return (
    <div className="stats mt-5 shadow">
      <div className="stat">
        <div className="stat-figure text-accent">
          <FontAwesomeIcon icon={faFile} size="2xl" className="ml-2" />
        </div>
        <div className="stat-title">Release Size</div>
        <div className="stat-value">
          {numBytes === undefined ? "?? B" : fileSize(numBytes)}
        </div>
        <div className="stat-desc">{numObjects ?? "??"} Objects</div>
      </div>
    </div>
  );
};

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  isAllowEdit: boolean;
};

export const FurtherRestrictionsBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
  isAllowEdit = false,
}) => {
  const utils = trpc.useContext();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      onSuccess: (result: ReleaseTypeLocal) =>
        // we need to cross over into TRPC world to invalidate its cache
        // eventually we should move this PATCH to TRPC too
        utils.release.getSpecificRelease.invalidate({
          releaseKey: releaseKey,
        }),
    },
  );

  const [releaseSize, setReleaseSize] = useState<
    "unknown" | "loading" | ReleaseSizeType
  >("unknown");

  const releaseSizeQuery = trpc.manifest.getReleaseSize.useQuery(
    { releaseKey },
    { enabled: false },
  );

  const onPressComputeSize = useCallback(async () => {
    setReleaseSize("loading");
    const result = await releaseSizeQuery.refetch();
    setReleaseSize(result.data ? result.data : "unknown");
  }, [releaseKey]);

  const isAllowedCheck = (
    label: ReactNode,
    path:
      | "/allowedRead"
      | "/allowedVariant"
      | "/allowedPhenotype"
      | "/allowedS3"
      | "/allowedGS"
      | "/allowedR2"
      | null,
    current: boolean,
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
    <Box
      heading="Access Control"
      applyIsDisabledStyle={!isAllowEdit}
      applyIsDisabledAllInput={!isAllowEdit}
      applyIsActivatedLockedStyle={!!releaseData.activation}
    >
      <RhSection>
        <LeftDiv
          heading={"Data"}
          extra={
            "Access must be granted based on the type and location of the data"
          }
        />
        <RightDiv>
          <div className="flex w-full">
            <div className="grid flex-grow">
              <RhChecks label="By Data Type">
                {isAllowedCheck("Identifiers (always allowed)", null, true)}
                {isAllowedCheck(
                  "Reads (e.g. BAM, CRAM, FASTQ, ORA)",
                  "/allowedRead",
                  releaseData.isAllowedReadData,
                )}
                {isAllowedCheck(
                  "Variants (e.g. VCF)",
                  "/allowedVariant",
                  releaseData.isAllowedVariantData,
                )}
                {isAllowedCheck(
                  "Phenotypes (e.g. FHIR, Phenopackets) (currently disabled)",
                  null,
                  false,
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
                  releaseData.isAllowedS3Data,
                )}
                {isAllowedCheck(
                  <>
                    Google GCP (<span className="font-mono">gs://...</span>)
                  </>,
                  "/allowedGS",
                  releaseData.isAllowedGSData,
                )}
                {isAllowedCheck(
                  <>
                    CloudFlare R2 (<span className="font-mono">r2://...</span>)
                  </>,
                  "/allowedR2",
                  releaseData.isAllowedR2Data,
                )}
              </RhChecks>
            </div>
          </div>
          <div className="flex items-end justify-end gap-x-5">
            <button
              type="button"
              disabled={releaseSize === "loading"}
              className="btn-normal w-fit"
              onClick={onPressComputeSize}
            >
              Compute Release Size
            </button>
            <Stats
              stats={
                releaseSize === "unknown" || releaseSize === "loading"
                  ? undefined
                  : releaseSize
              }
            />
          </div>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
