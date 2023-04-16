import React from "react";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "../shared-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trpc } from "../../../helpers/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { EagerErrorBoundary } from "../../../components/errors";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * Displays summary/important information about a release
 * and gives the ability to activate and deactivate them.
 *
 * @param releaseKey the unique key referring to this release
 * @param releaseData the information about this release
 * @constructor
 */
export const InformationBox: React.FC<Props> = ({
  releaseData,
  releaseKey,
}) => {
  // a right aligned list of all our datasets and their visualisation colour/box
  const DatasetList = () => (
    <ul className="text-right">
      {Array.from(releaseData.datasetMap.entries()).map(([uri, vis], index) => (
        <li key={index} className="flex flex-row justify-end align-middle">
          <span className="mr-6 font-mono">{uri}</span>
          <span className="h-6 w-6">{vis}</span>
        </li>
      ))}
    </ul>
  );

  const queryClient = useQueryClient();

  const activateMutation = trpc.releaseActivation.activate.useMutation();
  const deactivateMutation = trpc.releaseActivation.deactivate.useMutation();

  const error = activateMutation.error ?? deactivateMutation.error;

  // some handy state booleans
  const mutationInProgress =
    activateMutation.isLoading || deactivateMutation.isLoading;
  const releaseIsActivated = !!releaseData.activation;

  const ActivateDeactivateButtonRow = () => (
    <div className="flex flex-row space-x-4">
      <button
        className="btn-success btn-lg btn"
        disabled={releaseIsActivated || mutationInProgress}
        onClick={() =>
          activateMutation.mutate(
            { releaseKey },
            { onSuccess: async () => await queryClient.invalidateQueries() }
          )
        }
      >
        Activate Release
      </button>
      <button
        className="btn-warning btn-lg btn"
        disabled={!releaseIsActivated || mutationInProgress}
        onClick={() =>
          deactivateMutation.mutate(
            { releaseKey },
            { onSuccess: async () => await queryClient.invalidateQueries() }
          )
        }
      >
        Deactivate Release
      </button>
    </div>
  );

  return (
    <Box heading={releaseData.applicationDacTitle}>
      <div className="grid grid-cols-2 gap-4">
        {releaseIsActivated && (
          <div className="alert alert-success col-span-2 shadow-lg">
            <div>
              <span>Data sharing is activated for this release</span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <ActivateDeactivateButtonRow />
        </div>

        <div className="flex flex-col space-y-2">
          <DatasetList />
        </div>

        <div className="collapse-arrow rounded-box collapse col-span-2 border border-base-300 bg-base-100">
          <input type="checkbox" />

          <div className="collapse-compact collapse-title">
            See details of application
          </div>
          <div className="collapse-content">
            {releaseData.applicationDacDetails && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose"
                children={releaseData.applicationDacDetails}
              />
            )}
          </div>
        </div>
        {error && (
          <EagerErrorBoundary
            message="Something went wrong while (de)activating the release."
            error={error}
            styling="mt-5 shadow sm:rounded-md bg-red-100"
          />
        )}
      </div>
    </Box>
  );
};
