import React from "react";
import { useReleasesMasterData } from "../releases-types";
import { usePageSizer } from "../../../hooks/page-sizer";
import { AuditEventTable } from "../../../components/audit-event/audit-event-table";

export const AuditLogSubPage = () => {
  const pageSize = usePageSizer();

  return (
    <>
      <AuditEventTable path="users" filterMenu={false} pageSize={pageSize} />
    </>
  );
};
