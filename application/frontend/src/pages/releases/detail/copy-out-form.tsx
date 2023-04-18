import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../queries";
import { ReleaseTypeLocal } from "../shared-types";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * A form that allows researchers to entry the copy out destination
 *
 * @param releaseKey
 * @param releaseData
 * @constructor
 */
export const CopyOutForm: React.FC<Props> = ({ releaseKey, releaseData }) => {
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

  return (
    <>
      <form>
        <div className="flex flex-col gap-6">
          <div className="form-control prose">
            <label className="label">
              <span className="label-text">Destination for Copy Out</span>
            </label>
            <input
              type="text"
              className="input-bordered input w-full"
              defaultValue={releaseData.dataSharingCopyOut?.destinationLocation}
              onBlur={(e) =>
                releasePatchMutate.mutate({
                  op: "replace",
                  path: "/dataSharingConfiguration/copyOutDestinationLocation",
                  value: e.target.value,
                })
              }
            />
          </div>
        </div>
      </form>
    </>
  );
};
