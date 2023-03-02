import React from "react";
import { LayoutBase } from "../../../../layouts/layout-base";
import DataAccessLogsBox from "./data-access-logs";
import { ReleasesBreadcrumbsDiv } from "../../releases-breadcrumbs-div";
import { useParams } from "react-router-dom";

function DataAccessPage() {
  const { releaseId } = useParams<{ releaseId: string }>();

  if (!releaseId)
    throw new Error(
      `The component DataAccessPage cannot be rendered outside a route with a releaseId param`
    );

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <>
        <ReleasesBreadcrumbsDiv releaseId={releaseId} />
        <DataAccessLogsBox />
      </>
    </div>
  );
}

export default DataAccessPage;
