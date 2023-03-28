import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_RELEASE_KEYS } from "../queries";
import { trpc } from "../../../helpers/trpc";

type Props = {
  releaseKey: string;
};

/**
 * A form that trigger a copy out process.
 *
 * @param releaseKey
 * @constructor
 */
export const CopyOutForm: React.FC<Props> = ({ releaseKey }) => {
  const queryClient = useQueryClient();

  const copyOutMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSettled: async () =>
      queryClient.invalidateQueries(
        REACT_QUERY_RELEASE_KEYS.detail(releaseKey)
      ),
  });

  const [destinationBucket, setDestinationBucket] = useState(
    "elsa-data-copy-target-sydney"
  );

  return (
    <>
      <form>
        <div className="flex flex-col gap-6">
          <label className="prose block">
            <span className="text-xs font-bold uppercase text-gray-700">
              AWS Account(s)
            </span>
            <input
              type="text"
              value={destinationBucket}
              onChange={(e) => setDestinationBucket(e.target.value)}
              className="mt-1 block w-full rounded-md border-transparent bg-gray-50 focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <div className="prose">
            <button
              type="button"
              className="btn-normal"
              onClick={() => {
                copyOutMutate.mutate({
                  releaseKey: releaseKey,
                  destinationBucket: destinationBucket,
                });
              }}
              disabled={copyOutMutate.isLoading}
            >
              Copy Out
            </button>
          </div>
        </div>
      </form>
    </>
  );
};
