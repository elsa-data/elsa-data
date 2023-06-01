import React from "react";
import { Box } from "../../components/boxes";
import { DatasetTable } from "../../components/dataset/dataset-table";

export const DatasetsDashboardPage: React.FC = () => {
  return (
    <>
      <Box
        heading="Datasets"
        errorMessage={"Something went wrong fetching datasets."}
      >
        <DatasetTable />
      </Box>
    </>
  );
};
