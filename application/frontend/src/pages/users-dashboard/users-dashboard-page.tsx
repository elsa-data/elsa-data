import React from "react";
import { ALLOWED_ELSA_ADMIN_VIEW } from "@umccr/elsa-constants";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { Box } from "../../components/boxes";
import { OtherUsers } from "./other-users/other-users";
import { usePageSizer } from "../../hooks/page-sizer";
import { PersonalDetailsBox } from "./personal-detials-box/personal-details-box";

export const UsersDashboardPage: React.FC = () => {
  const pageSize = usePageSizer();

  const uiAllowed = useUiAllowed();

  return (
    <div className="flex flex-col space-y-4">
      <PersonalDetailsBox />
      {uiAllowed.has(ALLOWED_ELSA_ADMIN_VIEW) && (
        <OtherUsers pageSize={pageSize} />
      )}
    </div>
  );
};
