import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { LayoutBase } from "../../layouts/layout-base";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();

  return (
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <AuditEventTable path="users" pageSize={pageSize} />
      </div>
    </LayoutBase>
  );
};
