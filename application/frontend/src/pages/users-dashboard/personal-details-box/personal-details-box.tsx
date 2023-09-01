import React from "react";
import { Box } from "../../../components/boxes";

import { EditActiveUserPermissionDialog } from "../all-users/components/edit-active-user-permission-dialog";
import { useLoggedInUser } from "../../../providers/logged-in-user-provider";
import {
  CHANGE_USER_PERMISSION_DESC,
  CREATE_NEW_RELEASE_DESC,
  DATASET_UPDATE_DESC,
  OVERALL_ADMIN_VIEW_DESC,
} from "../helper";
import { DisplayUserInformation } from "../../../components/user/display-user-information";

type Props = {};

export const PersonalDetailsBox: React.FC<Props> = ({}) => {
  const userObject = useLoggedInUser();

  const Heading = () => (
    <div className="flex">
      <div>Basic Info</div>
    </div>
  );

  return (
    <Box heading={<Heading />}>
      <div className="flex w-full flex-col sm:flex-row">
        <div className="card rounded-box mb-2 grid flex-grow">
          <DisplayUserInformation
            user={{
              displayName: userObject?.displayName,
              email: userObject?.email,
              subjectIdentifier: userObject?.subjectIdentifier,
            }}
          />
        </div>
        <div className="divider divider-vertical sm:divider-horizontal" />
        <div className="card rounded-box flex-grow">
          <div className="flex">
            <h3 className="font-medium">Permissions</h3>
            <div>
              {userObject && (
                <EditActiveUserPermissionDialog user={userObject} />
              )}
            </div>
          </div>
          <ul className="list-inside list-disc">
            {userObject?.isAllowedChangeUserPermission && (
              <li className="mt-2">{CHANGE_USER_PERMISSION_DESC}</li>
            )}
            {userObject?.isAllowedOverallAdministratorView && (
              <li className="mt-2">{OVERALL_ADMIN_VIEW_DESC}</li>
            )}
            {userObject?.isAllowedRefreshDatasetIndex && (
              <li className="mt-2">{DATASET_UPDATE_DESC}</li>
            )}
            {userObject?.isAllowedCreateRelease && (
              <li className="mt-2">{CREATE_NEW_RELEASE_DESC}</li>
            )}

            {/* If no permission specific permission is given */}
            {!userObject?.isAllowedChangeUserPermission &&
              !userObject?.isAllowedOverallAdministratorView &&
              !userObject?.isAllowedRefreshDatasetIndex &&
              !userObject?.isAllowedCreateRelease && (
                <li className="mt-2" key={"no permissions"}>
                  No specific permissions.
                </li>
              )}
          </ul>
        </div>
      </div>
    </Box>
  );
};
