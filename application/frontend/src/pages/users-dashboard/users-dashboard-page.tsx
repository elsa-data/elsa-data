import React from "react";
import { ALLOWED_CHANGE_ADMINS } from "@umccr/elsa-constants";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { Box } from "../../components/boxes";
import { OthersBox } from "./others-box/others-box";
import { usePageSizer } from "../../hooks/page-sizer";
import { YouBox } from "./you-box/you-box";

export const UsersDashboardPage: React.FC = () => {
  const pageSize = usePageSizer();

  const uiAllowed = useUiAllowed();

  return (
    <div className="flex flex-col space-y-4">
      <YouBox />
      <OthersBox pageSize={pageSize} />
      {/* only the super admins can change other admins so they are the only ones to get this box */}
      {uiAllowed.has(ALLOWED_CHANGE_ADMINS) && <Box heading="Others"></Box>}
    </div>
  );
};
