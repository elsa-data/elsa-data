import React from "react";
import { AllUsers } from "./all-users/all-users";
import { usePageSizer } from "../../hooks/page-sizer";
import { PersonalDetailsBox } from "./personal-details-box/personal-details-box";
import { useLoggedInUser } from "../../providers/logged-in-user-provider";

export const UsersDashboardPage: React.FC = () => {
  const user = useLoggedInUser();
  const pageSize = usePageSizer();

  // in the first instance - we need to decide if the user can see other users
  // at all... we give this right to the overall admins (they can _view_ everything) - but
  // we also give this right to those who have the "change user permission" right
  // (as this is the only way they can actually use this right on other users)
  const canSeeOtherUsers =
    user?.isAllowedOverallAdministratorView ||
    user?.isAllowedChangeUserPermission;

  return (
    <div className="flex flex-col space-y-4">
      <PersonalDetailsBox />
      {canSeeOtherUsers && <AllUsers pageSize={pageSize} />}
    </div>
  );
};
