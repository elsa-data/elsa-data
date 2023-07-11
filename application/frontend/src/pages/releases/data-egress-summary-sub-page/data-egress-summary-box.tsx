import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { DataEgressSummaryTable } from "../../../components/data-egress/data-egress-summary-table";
import { DataEgressDetailedTable } from "../../../components/data-egress/data-egress-detailed-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faX } from "@fortawesome/free-solid-svg-icons";
import { trpc } from "../../../helpers/trpc";
import { EagerErrorBoundary } from "../../../components/errors";
import { useUiAllowed } from "../../../hooks/ui-allowed";
import { ALLOWED_DATASET_UPDATE } from "@umccr/elsa-constants";
import { Alert } from "../../../components/alert";

export const DataEgressSummaryBox = ({
  releaseKey,
}: {
  releaseKey: string;
}) => {
  const [isSummaryView, setIsSummaryView] = useState<boolean>(true);
  const uiAllowed = useUiAllowed();
  const utils = trpc.useContext();

  const updateReleaseEgressRecordMutate =
    trpc.releaseDataEgress.updateDataEgressRecord.useMutation({
      onSettled: async () => {
        await utils.releaseDataEgress.invalidate();
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
              disabled={updateReleaseEgressRecordMutate.isLoading}
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
      {updateReleaseEgressRecordMutate.isLoading && (
        <Alert
          icon={<span className="loading loading-bars loading-xs" />}
          description={"Updating data egress records"}
          additionalAlertClassName={
            "alert alert-info bg-slate-300 text-md py-1 mb-3"
          }
        />
      )}
      {updateReleaseEgressRecordMutate.isSuccess && (
        <Alert
          description={"Successfully update egress records."}
          additionalAlertClassName={"alert alert-success text-md py-1 mb-3"}
        />
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
