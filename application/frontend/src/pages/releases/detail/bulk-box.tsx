import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import { ApplicationCodedBox } from "./application-coded-box";
import { HrDiv, LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { axiosPostNullMutationFn, REACT_QUERY_RELEASE_KEYS } from "./queries";
import { isUndefined } from "lodash";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const BulkBox: React.FC<Props> = ({ releaseId, releaseData }) => {
  const queryClient = useQueryClient();

  // *only* when running a job in the background - we want to set up a polling loop of the backend
  // so we set this effect up with a dependency on the runningJob field - and switch the
  // interval on only when there is background job
  useEffect(() => {
    const interval = setInterval(() => {
      if (releaseData.runningJob) {
        console.log("Refreshing running job status");
        queryClient.invalidateQueries(
          REACT_QUERY_RELEASE_KEYS.detail(releaseId)
        );
      }
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [releaseData.runningJob]);

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
  };

  const applyAllMutate = useMutation(
    axiosPostNullMutationFn(`/api/releases/${releaseId}/jobs/select`)
  );

  const cancelMutate = useMutation(
    axiosPostNullMutationFn(`/api/releases/${releaseId}/jobs/cancel`)
  );

  return (
    <Box heading="Bulk">
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Consent Sources"}
          extra={
            "Datasets may include their own per case/patient/specimen consent preferences. Where overriding consent information is held externally, the URL for this service may be specified here"
          }
        />
        <RightDiv>
          <textarea>AA</textarea>
        </RightDiv>
      </div>
      <HrDiv />
      <ApplicationCodedBox
        releaseId={releaseId}
        applicationCoded={releaseData.applicationCoded}
      />
      <HrDiv />
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Virtual Cohort"}
          extra={
            "A virtual cohort may be layered over the base consent information - allowing the release to be limited to 'males under 25' for example"
          }
        />
        <RightDiv>
          <textarea
            className="font-mono border-none w-full"
            rows={10}
            value={
              "{\n" +
              '  "requestParameters": {\n' +
              '    "referenceName": "NC_000017.11",\n' +
              '    "start": [ 5000000, 7676592 ],\n' +
              '    "end": [ 7669607, 10000000 ],\n' +
              '    "variantType": "DEL"\n' +
              "  }\n" +
              "}"
            }
          ></textarea>
        </RightDiv>
      </div>
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

                    <button
                      className="btn-normal"
                      onClick={async () => {
                        cancelMutate.mutate(null, {
                          onSuccess: afterMutateUpdateQueryData,
                        });
                      }}
                      disabled={
                        !releaseData.runningJob ||
                        releaseData.runningJob.requestedCancellation
                      }
                    >
                      Cancel
                      {releaseData.runningJob?.requestedCancellation && (
                        <span> (in progress)</span>
                      )}
                    </button>
                  </div>

                  {releaseData.runningJob && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-blue-700">
                          Running
                        </span>
                        <span className="text-sm font-medium text-blue-700">
                          {releaseData.runningJob.percentDone.toString()}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width:
                              releaseData.runningJob.percentDone.toString() +
                              "%",
                          }}
                        ></div>
                      </div>
                      <p></p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </RightDiv>
      </div>
    </Box>
  );
};
