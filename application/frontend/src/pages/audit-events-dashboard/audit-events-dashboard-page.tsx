import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { AuditEventTable } from "../../components/audit-event/audit-event-table";
import { useLoggedInUser } from "../../providers/logged-in-user-provider";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();
  const user = useLoggedInUser();

  return (
    <AuditEventTable
      filterElements={true}
      filterElementsInitial={["user"]}
      pageSize={pageSize}
      showAdminView={!!user?.isAllowedOverallAdministratorView}
      type="AuditEvent"
    />
  );
};
