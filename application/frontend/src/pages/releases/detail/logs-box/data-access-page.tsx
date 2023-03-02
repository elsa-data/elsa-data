import React from "react";
import DataAccessLogsBox from "./data-access-logs";
import { ReleasesBreadcrumbsDiv } from "../../releases-breadcrumbs-div";
import { useParams } from "react-router-dom";

function DataAccessPage() {
  const { id } = useParams<{ id: string }>();

  if (!id)
    throw new Error(
      `The component DataAccessPage cannot be rendered outside a route with a releaseId param`
    );

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <>
        <ReleasesBreadcrumbsDiv releaseId={id} />
        <DataAccessLogsBox />
      </>
    </div>
  );
}

export default DataAccessPage;
