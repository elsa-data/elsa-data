import React from "react";
import { Box } from "../../../components/boxes";

import { EditPermissionDialog } from "../all-users/components/edit-permission-dialog";
import { useLoggedInUser } from "../../../providers/logged-in-user-provider";
import {
  CHANGE_USER_PERMISSION_DESC,
  CREATE_NEW_RELEASE_DESC,
  DATASET_UPDATE_DESC,
  OVERALL_ADMIN_VIEW_DESC,
} from "../helper";

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
        <div className="card rounded-box grid flex-grow">
          <h3 className="font-medium">Name</h3>
          <p>{userObject?.displayName}</p>
          <br />

          <h3 className="font-medium">Email</h3>
          <p>{userObject?.displayName}</p>
          <br />

          <h3 className="font-medium">Subject Identifier</h3>
          <p>{userObject?.subjectIdentifier}</p>
        </div>
        <div className="divider divider-vertical sm:divider-horizontal" />
        <div className="card rounded-box flex-grow">
          <div className="flex">
            <h3 className="font-medium">Permissions</h3>
            <div>
              {userObject && <EditPermissionDialog user={userObject} />}
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
