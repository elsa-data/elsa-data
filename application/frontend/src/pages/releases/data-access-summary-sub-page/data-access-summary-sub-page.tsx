import React from "react";
import { DataAccessSummaryBox } from "./data-access-summary-box";
import { useReleasesMasterData } from "../releases-types";

export const DataAccessSummarySubPage = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  return (
    <>
      <DataAccessSummaryBox releaseId={releaseId} />
    </>
  );
};
