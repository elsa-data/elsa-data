import React from "react";
import { usePageSizer } from "../../../hooks/page-sizer";
import { JobTable } from "../../../components/job/job-table";
import { useParams } from "react-router-dom";
import { useUiAllowed } from "../../../hooks/ui-allowed";

export const JobsSubPage = () => {
  const pageSize = usePageSizer();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  if (!releaseKey)
    throw new Error(
      `The component JobsSubPage cannot be rendered outside a route with a releaseKey param`
    );

  const allowed = useUiAllowed();

  return <JobTable pageSize={pageSize} releaseKey={releaseKey} />;
};
