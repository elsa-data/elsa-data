import React from "react";
import { usePageSizer } from "../../hooks/page-sizer";
import { LayoutBase } from "../../layouts/layout-base";
import { AuditEventsBox } from "./audit-events-box/audit-events-box";

export const AuditEventsPage = (): JSX.Element => {
  const pageSize = usePageSizer();

  return (
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <AuditEventsBox pageSize={pageSize} />
      </div>
    </LayoutBase>
  );
};
