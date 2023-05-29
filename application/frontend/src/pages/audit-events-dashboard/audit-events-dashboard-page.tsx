import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";
import { ALLOWED_OVERALL_ADMIN_VIEW } from "@umccr/elsa-constants";
import { useUiAllowed } from "../../hooks/ui-allowed";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();

  const allowed = useUiAllowed();

  return (
    <AuditEventTable
      path="users"
      filterElements={true}
      filterElementsInitial={["user"]}
      pageSize={pageSize}
      showAdminView={allowed.has(ALLOWED_OVERALL_ADMIN_VIEW)}
    />
  );
};
