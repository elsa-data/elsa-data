import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Box } from "../../../../components/boxes";
import { ReleaseTypeLocal } from "../../shared-types";
import { ApplicationCodedBox } from "./application-coded-box";
import {
  HrDiv,
  LeftDiv,
  RightDiv,
} from "../../../../components/rh/rh-structural";
import { REACT_QUERY_RELEASE_KEYS } from "../../queries";
import { isUndefined } from "lodash";
import { EagerErrorBoundary, ErrorState } from "../../../../components/errors";
import { trpc } from "../../../../helpers/trpc";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const BulkBox: React.FC<Props> = ({ releaseKey, releaseData }) => {
  const queryClient = useQueryClient();

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
      result,
    );
    setError({ error: null, isSuccess: true });
  };

  const applyAllMutate = trpc.releaseJob.startCohortConstruction.useMutation({
    onSettled: async () => await queryClient.invalidateQueries(),
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: () => setError({ error: null, isSuccess: true }),
  });

  const isActivated = !!releaseData.activation;
  const isJobRunning = !isUndefined(releaseData.runningJob);

  return (
    <Box
      heading="Cohort Constructor"
      applyIsActivatedLockedStyle={isActivated}
      applyIsDisabledAllInput={isActivated}
    >
      {/*
      The consent sources are not needed until we hook up real Dynamic systems like CTRL
      <ConsentSourcesBox releaseKey={releaseKey} />
      <HrDiv /> */}
      <ApplicationCodedBox
        releaseKey={releaseKey}
        applicationCoded={releaseData.applicationCoded}
      />
      {/*
      The virtual cohorting has been mixed in with the application coding for a bit - revisit
      <HrDiv />
      <VirtualCohortBox releaseKey={releaseKey} /> */}
      <HrDiv />
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Apply"}
          extra={
            "Executing this operation will start a background task that calculates the correct sharing status for every specimen in the release"
          }
        />
        <RightDiv>
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-3 flex flex-col gap-6">
                {!error.isSuccess && <EagerErrorBoundary error={error.error} />}

                <div className="flex flex-row space-x-1">
                  <button
                    className="btn-normal"
                    onClick={() =>
                      applyAllMutate.mutate({ releaseKey: releaseKey })
                    }
                    disabled={
                      isJobRunning || isActivated || applyAllMutate.isLoading
                    }
                  >
                    Apply All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </RightDiv>
      </div>
    </Box>
  );
};
