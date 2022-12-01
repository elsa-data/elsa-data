import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { Box } from "../../../../components/boxes";
import { ReleaseTypeLocal } from "../shared-types";
import { ApplicationCodedBox } from "./application-coded-box";
import {
  HrDiv,
  LeftDiv,
  RightDiv,
} from "../../../../components/rh/rh-structural";
import { axiosPostNullMutationFn, REACT_QUERY_RELEASE_KEYS } from "../queries";
import { isUndefined } from "lodash";
import { ConsentSourcesBox } from "./consent-sources-box";
import { VirtualCohortBox } from "./virtual-cohort-box";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const BulkBox: React.FC<Props> = ({ releaseId, releaseData }) => {
  const queryClient = useQueryClient();

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
  };

  const applyAllMutate = useMutation(
    axiosPostNullMutationFn(`/api/releases/${releaseId}/jobs/select`)
  );

  return (
    <Box heading="Bulk">
      {/*
      The consent sources are not needed until we hook up real Dynamic systems like CTRL
      <ConsentSourcesBox releaseId={releaseId} />
      <HrDiv /> */}
      <ApplicationCodedBox
        releaseId={releaseId}
        applicationCoded={releaseData.applicationCoded}
      />
      {/*
      The virtual cohorting has been mixed in with the application coding for a bit - revisit
      <HrDiv />
      <VirtualCohortBox releaseId={releaseId} /> */}
      <HrDiv />
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Apply"}
          extra={
            "Executing this operation will start a background task that calculates the correct sharing status for every specimen in the release"
          }
        />
        <RightDiv>
          <div className="shadow sm:rounded-md">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-6 col-span-3">
                  <div className="flex flex-row space-x-1">
                    <button
                      className="btn-normal"
                      onClick={async () => {
                        applyAllMutate.mutate(null, {
                          onSuccess: afterMutateUpdateQueryData,
                        });
                      }}
                      disabled={!isUndefined(releaseData.runningJob)}
                    >
                      Apply All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RightDiv>
      </div>
    </Box>
  );
};
