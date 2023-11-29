import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { axiosPatchOperationMutationFn } from "../../queries";
import { ReleaseTypeLocal } from "../../shared-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";
import { trpc } from "../../../../helpers/trpc";
import { EagerErrorBoundary } from "../../../../components/errors";
import { TsvDownloadDiv } from "./tsv-download-div";

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
    },
  );
  const [input, setInput] = useState<string>(
    releaseData.dataSharingCopyOut?.destinationLocation ?? "",
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
          The copy out mechanism provides an ability to bulk copy released
          objects into another bucket.
        </p>
        <p>
          The data applicants can provide the name of the destination bucket
          here - but the actual copy process can only be initiated by the data
          administrators. Let them know when the bucket is ready to receive
          data.
        </p>

        {/* ok so this isn't the worlds best pattern - we possibly should be doing some sort of
              autosave with a de-bounce - but anyhow - for a field that is rarely edited it is fine */}
        <div className="flex flex-row items-center space-x-2">
          <label className="label">
            <span className="label-text">Destination Bucket</span>
          </label>

          <input
            type="text"
            className="input-bordered input w-1/2 font-mono"
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            disabled={isLoading || isMatchDb}
            className="btn btn-sm"
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
          {isMatchDb ? (
            <FontAwesomeIcon
              size="sm"
              className="text-green-500"
              icon={faCheck}
            />
          ) : (
            <FontAwesomeIcon
              size="sm"
              className="text-slate-300"
              icon={faCircle}
            />
          )}
        </div>

        <div className="divider"></div>

        <TsvDownloadDiv
          actionUrl={`/api/releases/${releaseKey}/tsv-manifest-plaintext`}
          releaseActivated={!!releaseData.activation}
          fieldsToExclude={[
            "objectStoreSigned",
            "objectStoreProtocol",
            "objectStoreBucket",
            "objectStoreKey",
            "objectStoreUrl",
          ]}
        />
      </div>
    </>
  );
};
