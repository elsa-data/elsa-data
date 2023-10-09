import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { axiosPatchOperationMutationFn } from "../../queries";
import { ReleaseTypeLocal } from "../../shared-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";
import { trpc } from "../../../../helpers/trpc";
import { EagerErrorBoundary } from "../../../../components/errors";

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
  const utils = trpc.useContext();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // whenever we do a patch mutations of our release we need to invalidate our trpc state
      // to force a refresh
      onSuccess: async (result: ReleaseTypeLocal) => {
        await utils.release.getSpecificRelease.invalidate();
      },
      onError: (e) => {
        console.log(e);
      },
    }
  );
  const [input, setInput] = useState<string>(
    releaseData.dataSharingCopyOut?.destinationLocation ?? ""
  );

  const isMatchDb =
    input === releaseData.dataSharingCopyOut?.destinationLocation;
  const isLoading = releasePatchMutate.isLoading;

  return (
    <>
      {releasePatchMutate.isError && (
        <EagerErrorBoundary error={releasePatchMutate.error} />
      )}
      <div className="prose-sm flex flex-col">
        <p>
          The copy out mechanism provides an administrator triggered mechanism
          to bulk copy release objects into another bucket.
        </p>

        <div className="divider"></div>

        <label className="label">
          <span className="label-text">Destination for Copy Out</span>
        </label>

        <div className="flex flex-row">
          <input
            type="text"
            className="input-bordered input w-full"
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex w-10 items-center justify-center ">
            {isMatchDb ? (
              <FontAwesomeIcon className="text-green-500" icon={faCheck} />
            ) : (
              <FontAwesomeIcon
                size="xs"
                className="text-slate-300"
                icon={faCircle}
              />
            )}
          </div>
        </div>
        <div className="prose">
          <button
            disabled={isLoading}
            className="btn-normal btn mt-4"
            onClick={() =>
              releasePatchMutate.mutate({
                op: "replace",
                path: "/dataSharingConfiguration/copyOutDestinationLocation",
                value: input,
              })
            }
          >
            {isLoading && <span className="loading loading-spinner" />}
            {"Save"}
          </button>
        </div>
      </div>
    </>
  );
};
