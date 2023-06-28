import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { DataEgressSummaryTable } from "../../../components/data-egress/data-egress-summary-table";
import { DataEgressDetailedTable } from "../../../components/data-egress/data-egress-detailed-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faX } from "@fortawesome/free-solid-svg-icons";
import { trpc } from "../../../helpers/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { EagerErrorBoundary } from "../../../components/errors";
import { useUiAllowed } from "../../../hooks/ui-allowed";
import { ALLOWED_DATASET_UPDATE } from "@umccr/elsa-constants";

export const DataEgressSummaryBox = ({
  releaseKey,
}: {
  releaseKey: string;
}) => {
  const [isSummaryView, setIsSummaryView] = useState<boolean>(true);
  const [isSuccessShow, setIsSuccessShow] = useState<boolean>(false);
  const uiAllowed = useUiAllowed();

  const queryClient = useQueryClient();
  const updateReleaseEgressRecordMutate =
    trpc.releaseDataEgress.updateDataEgressRecord.useMutation({
      onSuccess: () => {
        setIsSuccessShow(true);
      },
      onSettled: () => {
        queryClient.invalidateQueries();
      },
    });

  const BoxHeader = () => {
    return (
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center">
          {/* Title */}
          <div>Data Egress Details</div>

          {/* Button for update data egress records */}
          {uiAllowed.has(ALLOWED_DATASET_UPDATE) && (
            <button
              className="btn-outline btn-xs btn ml-2"
              onClick={() =>
                updateReleaseEgressRecordMutate.mutate({ releaseKey })
              }
            >
              <FontAwesomeIcon
                spin={updateReleaseEgressRecordMutate.isLoading}
                icon={faRotate}
              />
            </button>
          )}
        </span>

        {/* Toggle to view as summary */}
        <label className="label cursor-pointer !py-0">
          <span className="label-text mr-2">Summary View</span>
          <input
            type="checkbox"
            className="checkbox checkbox-xs"
            checked={isSummaryView}
            onChange={() => setIsSummaryView((p) => !p)}
          />
        </label>
      </div>
    );
  };

  return (
    <Box heading={<BoxHeader />}>
      {updateReleaseEgressRecordMutate.isError && (
        <EagerErrorBoundary error={updateReleaseEgressRecordMutate.error} />
      )}
      {isSuccessShow && (
        <div className="alert alert-success flex w-full justify-between shadow-lg">
          <span>Successfully update egress records.</span>
          <button
            className="btn-outline btn-xs btn-circle btn"
            onClick={() => setIsSuccessShow(false)}
          >
            <FontAwesomeIcon icon={faX} />
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        {isSummaryView ? (
          <DataEgressSummaryTable releaseKey={releaseKey} />
        ) : (
          <DataEgressDetailedTable releaseKey={releaseKey} />
        )}
      </div>
    </Box>
  );
};
