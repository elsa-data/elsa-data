import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { LayoutBase } from "../../layouts/layout-base";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";
import { useParams } from "react-router-dom";

export const AuditEventsPage = (): JSX.Element => {
  const { id: userId } = useParams<{ id: string }>();

  if (!userId)
    throw new Error(
      `The component AuditEventsPage cannot be rendered outside a route with an id param`
    );

  const pageSize = usePageSizer();

  return (
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <AuditEventTable path="users" id={userId} pageSize={pageSize} />
      </div>
    </LayoutBase>
  );
};
