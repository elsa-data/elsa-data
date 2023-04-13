import React from "react";
import { DatasetsBox } from "./datasets-box/datasets-box";
import { usePageSizer } from "../../hooks/page-sizer";

export const DatasetsDashboardPage: React.FC = () => {
  return (
    <>
      <DatasetsBox />
    </>
  );
};
