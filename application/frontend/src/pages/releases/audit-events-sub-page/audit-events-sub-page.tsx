import React from "react";
import { usePageSizer } from "../../../hooks/page-sizer";
import { AuditEventTable } from "../../../components/audit-event/audit-event-table";
import { useParams } from "react-router-dom";

export const AuditEventsSubPage = () => {
  const pageSize = usePageSizer();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  return (
    <>
      <AuditEventTable
        path="releases"
        id={releaseKey}
        filterElements={false}
        filterElementsInitial={["release"]}
        pageSize={pageSize}
      />
    </>
  );
};
