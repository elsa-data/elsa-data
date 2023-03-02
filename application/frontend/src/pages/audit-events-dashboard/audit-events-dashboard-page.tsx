import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <AuditEventTable path="users" pageSize={pageSize} />
    </div>
  );
};
