import React from "react";
import { DataAccessSummaryBox } from "./data-egress-summary-box";
import { useReleasesMasterData } from "../releases-types";

export const DataAccessSummarySubPage = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  return (
    <>
      <DataAccessSummaryBox releaseKey={releaseKey} />
    </>
  );
};
