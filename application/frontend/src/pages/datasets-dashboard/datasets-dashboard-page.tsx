import React from "react";
import { Box } from "../../components/boxes";
import { DatasetsTable } from "./datasets-table.tsx";

export const DatasetsDashboardPage: React.FC = () => {
  return (
    <>
      <Box heading="Datasets">
        <DatasetsTable />
      </Box>
    </>
  );
};
