import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import { HrDiv, LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { axiosPostArgMutationFn, REACT_QUERY_RELEASE_KEYS } from "./queries";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const FutherRestrictionsBox: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  const [lastMutateError, setLastMutateError] = useState<string | null>(null);

  // whenever we do a mutation of application coded data - our API returns the complete updated
  // state of the whole release
  // we set this as the success function to take advantage of that
  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
    setLastMutateError(null);
  };

  const afterMutateError = (err: any) => {
    setLastMutateError(err?.response?.data?.detail || "Error");
  };

  const changeAllowedRead = useMutation(
    axiosPostArgMutationFn<{ value: boolean }>(
      `/api/releases/${releaseId}/fields/allowed-read/set`
    )
  );

  const changeAllowedVariant = useMutation(
    axiosPostArgMutationFn<{ value: boolean }>(
      `/api/releases/${releaseId}/fields/allowed-variant/set`
    )
  );

  const changeAllowedPhenotype = useMutation(
    axiosPostArgMutationFn<{ value: boolean }>(
      `/api/releases/${releaseId}/fields/allowed-phenotype/set`
    )
  );

  const isAllowedCheck = (
    label: string,
    mutate: UseMutationResult<
      ReleaseTypeLocal,
      unknown,
      { value: boolean },
      unknown
    > | null,
    current: boolean
  ) => (
    <RhCheckItem
      label={label}
      checked={current}
      disabled={!mutate}
      onChange={(e) => {
        if (mutate) {
          mutate.mutate(
            { value: !current },
            {
              onSuccess: afterMutateUpdateQueryData,
              onError: afterMutateError,
            }
          );
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
              changeAllowedRead,
              releaseData.isAllowedReadData
            )}
            {isAllowedCheck(
              "Variant Data (e.g. VCF)",
              changeAllowedVariant,
              releaseData.isAllowedVariantData
            )}
            {isAllowedCheck(
              "Phenotype Data (e.g. FHIR, Phenopackets)",
              changeAllowedPhenotype,
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
