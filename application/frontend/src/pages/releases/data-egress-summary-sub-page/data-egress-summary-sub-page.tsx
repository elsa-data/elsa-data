import React from "react";
import { DataEgressSummaryBox } from "./data-egress-summary-box";
import { useReleasesMasterData } from "../releases-types";

export const DataEgressSummarySubPage = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  return (
    <>
      <DataEgressSummaryBox releaseKey={releaseKey} />
    </>
  );
};
