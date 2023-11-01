import React from "react";
import { usePageSizer } from "../../../hooks/page-sizer";
import { JobTable } from "../../../components/job/job-table";
import { useParams } from "react-router-dom";

export const JobsSubPage = () => {
  const pageSize = usePageSizer();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  if (!releaseKey)
    throw new Error(
      `The component JobsSubPage cannot be rendered outside a route with a releaseKey param`,
    );

  return <JobTable pageSize={pageSize} releaseKey={releaseKey} />;
};
