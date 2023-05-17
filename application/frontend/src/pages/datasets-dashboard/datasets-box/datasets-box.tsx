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
      <div className="border-b bg-gray-50 p-5 text-right sm:px-6">
        <div className="flex justify-start">
          <div
            className="inline-flex cursor-pointer items-center"
            onClick={() => setIncludeDeletedFile((p) => !p)}
          >
            <input
              className="checkbox-accent checkbox mr-2 h-3 w-3 cursor-pointer rounded-sm"
              type="checkbox"
              checked={includeDeletedFile}
              onChange={() => setIncludeDeletedFile((p) => !p)}
            />
            <label className="flex text-gray-800">
              <ToolTip
                trigger={
                  <div className="flex cursor-pointer items-center text-xs">
                    Include deleted files
                  </div>
                }
                description={`If checked the summary will include deleted files.`}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-auto">
        <DatasetTable includeDeletedFile={includeDeletedFile} />
      </div>
    </Box>
  );
};
