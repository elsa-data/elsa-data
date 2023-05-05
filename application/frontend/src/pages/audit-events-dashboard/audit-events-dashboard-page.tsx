import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();

  return (
    <AuditEventTable
      path="users"
      filterMenu={true}
      filterMenuInitial={["user"]}
      pageSize={pageSize}
    />
  );
};
