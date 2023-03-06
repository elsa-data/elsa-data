import React from "react";
import DataAccessSummaryBox from "../detail/logs-box/data-access-summary";
import { useReleasesMasterData } from "../releases-types";

export const DataAccessSummarySubPage = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  return (
    <>
      <DataAccessSummaryBox releaseId={releaseId} />
    </>
  );
};
