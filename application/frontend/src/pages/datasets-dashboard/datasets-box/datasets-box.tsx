import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { ToolTip } from "../../../components/tooltip";
import { DatasetTable } from "../../../components/dataset/dataset-table";

export const DatasetsBox: React.FC = () => {
  const [includeDeletedFile, setIncludeDeletedFile] = useState<boolean>(false);

  return (
    <Box
      heading="Datasets"
      errorMessage={"Something went wrong fetching datasets."}
    >
      <DatasetTable includeDeletedFile={includeDeletedFile} />
    </Box>
  );
};
