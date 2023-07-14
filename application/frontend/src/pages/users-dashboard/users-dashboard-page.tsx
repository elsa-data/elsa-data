import React from "react";
import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASE,
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
} from "@umccr/elsa-constants";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { OtherUsers } from "./other-users/other-users";
import { usePageSizer } from "../../hooks/page-sizer";
import { PersonalDetailsBox } from "./personal-details-box/personal-details-box";

export const CHANGE_USER_PERMISSION_DESC =
  "Allowed to change other user's permission.";
export const CREATE_NEW_RELEASE_DESC =
  "Allowed to create and become a release administrator.";
export const OVERALL_ADMIN_VIEW_DESC =
  "Allowed to view as an app administrator.";
export const DATASET_UPDATE_DESC = "Allowed to update/refresh dataset index.";

export const UsersDashboardPage: React.FC = () => {
  const pageSize = usePageSizer();

  const uiAllowed = useUiAllowed();

  // in the first instance - we need to decide if the user can see other users
  // at all... we give this right to the overall admins (they can _view_ everything) - but
  // we also give this right to those who have the "change user permission" right
  // (as this is the only way they can actually use this right on other users)
  const canSeeOtherUsers =
    uiAllowed.has(ALLOWED_OVERALL_ADMIN_VIEW) ||
    uiAllowed.has(ALLOWED_CHANGE_USER_PERMISSION);

  return (
    <div className="flex flex-col space-y-4">
      {/* <PersonalDetailsBox /> */}
      {/* {canSeeOtherUsers && <OtherUsers pageSize={pageSize} />} */}
    </div>
  );
};
