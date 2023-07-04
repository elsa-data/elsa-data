import React from "react";
import { useReleasesMasterData } from "../releases-types";
import { BulkBox } from "./bulk-box/bulk-box";

export const BulkSelectorSubPage = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  return (
    <>
      <BulkBox releaseKey={releaseKey} releaseData={releaseData} />
    </>
  );
};
