import React from "react";
import DataAccessSummaryBox from "../detail/logs-box/data-access-summary";
import { useReleasesMasterData } from "../releases-types";
import { BulkBox } from "../detail/bulk-box/bulk-box";

export const BulkSelectorSubPage = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  return (
    <>
      <BulkBox releaseId={releaseId} releaseData={releaseData} />
    </>
  );
};
