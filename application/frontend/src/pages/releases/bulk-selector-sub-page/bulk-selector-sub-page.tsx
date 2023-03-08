import React from "react";
import { useReleasesMasterData } from "../releases-types";
import { BulkBox } from "./bulk-box/bulk-box";

export const BulkSelectorSubPage = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  return (
    <>
      <BulkBox releaseId={releaseId} releaseData={releaseData} />
    </>
  );
};
