import React from "react";
import { useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import { CopiedObjectsReport } from "./copied-objects-report.tsx";

type CopiesDetailPageParams = {
  copyExecutionArn: string;
};

export const CopiesDetailPage: React.FC = () => {
  const { copyExecutionArn: copyExecutionArnEncoded } =
    useParams<CopiesDetailPageParams>();

  const copyExecutionArn = decodeURIComponent(copyExecutionArnEncoded ?? "");

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap space-y-4">
      <>
        <Box heading="Report">
          <CopiedObjectsReport copyExecutionArn={copyExecutionArn} />
        </Box>
      </>
    </div>
  );
};
