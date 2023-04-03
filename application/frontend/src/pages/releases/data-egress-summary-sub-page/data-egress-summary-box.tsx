import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { DataEgressSummaryTable } from "../../../components/data-egress/data-egress-summary-table";
import { DataEgressDetailedTable } from "../../../components/data-egress/data-egress-detailed-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faRotate } from "@fortawesome/free-solid-svg-icons";

export const DataAccessSummaryBox = ({
  releaseKey,
}: {
  releaseKey: string;
}) => {
  const [isSummaryView, setIsSummaryView] = useState<boolean>(true);

  const BoxHeader = () => {
    return (
      <div className="flex w-full items-center justify-between">
        {/* Title && Trigger Button for import */}
        <span className="flex items-center">
          <div>Data Egress Details</div>
          <button className="btn-outline btn-xs btn ml-2">
            <FontAwesomeIcon icon={faRotate} />
          </button>
        </span>

        {/* Toggle to view as summary */}
        <label className="label cursor-pointer">
          <span className="label-text mr-2">Summary View</span>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={isSummaryView}
            onChange={() => setIsSummaryView((p) => !p)}
          />
        </label>
      </div>
    );
  };

  return (
    <Box heading={<BoxHeader />}>
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
