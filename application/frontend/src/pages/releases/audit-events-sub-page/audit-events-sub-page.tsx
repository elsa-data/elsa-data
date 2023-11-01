import React from "react";
import { usePageSizer } from "../../../hooks/page-sizer";
import { AuditEventTable } from "../../../components/audit-event/audit-event-table";
import { useParams } from "react-router-dom";
import { useLoggedInUser } from "../../../providers/logged-in-user-provider";

export const AuditEventsSubPage = () => {
  const pageSize = usePageSizer();
  const user = useLoggedInUser();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  if (!releaseKey)
    throw new Error(
      `The component AuditEventsSubPage cannot be rendered outside a route with a releaseKey param`,
    );

  return (
    <>
      <AuditEventTable
        filterElements={false}
        filterElementsInitial={["release"]}
        pageSize={pageSize}
        showAdminView={!!user?.isAllowedOverallAdministratorView}
        type={{ releaseKey }}
      />
    </>
  );
};
