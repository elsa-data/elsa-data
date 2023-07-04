import React from "react";
import { usePageSizer } from "../../../hooks/page-sizer";
import { AuditEventTable } from "../../../components/audit-event/audit-event-table";
import { useParams } from "react-router-dom";
import { useUiAllowed } from "../../../hooks/ui-allowed";
import { ALLOWED_OVERALL_ADMIN_VIEW } from "@umccr/elsa-constants";

export const AuditEventsSubPage = () => {
  const pageSize = usePageSizer();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  if (!releaseKey)
    throw new Error(
      `The component AuditEventsSubPage cannot be rendered outside a route with a releaseKey param`
    );

  const allowed = useUiAllowed();

  return (
    <>
      <AuditEventTable
        filterElements={false}
        filterElementsInitial={["release"]}
        pageSize={pageSize}
        showAdminView={allowed.has(ALLOWED_OVERALL_ADMIN_VIEW)}
        type={{ releaseKey }}
      />
    </>
  );
};
