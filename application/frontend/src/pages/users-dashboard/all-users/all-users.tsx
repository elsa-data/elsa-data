import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { UserPermissionType } from "@umccr/elsa-types/schemas-users";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderPlus,
  faUsersGear,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import {
  CHANGE_USER_PERMISSION_DESC,
  CREATE_NEW_RELEASE_DESC,
  DATASET_UPDATE_DESC,
  OVERALL_ADMIN_VIEW_DESC,
} from "../helper";
import { ActiveUserTable } from "./components/active-user-table";
import { PotentialUserTable } from "./components/potential-user-table";
import classNames from "classnames";

enum UserTableType {
  ACTIVE,
  INVITED,
}

export const permissionIconProperties: {
  key: UserPermissionType;
  title: string;
  icon: JSX.Element;
}[] = [
  {
    title: CHANGE_USER_PERMISSION_DESC,
    key: "isAllowedChangeUserPermission",
    icon: <FontAwesomeIcon icon={faUsersGear} />,
  },
  {
    title: OVERALL_ADMIN_VIEW_DESC,
    key: "isAllowedOverallAdministratorView",
    icon: <FontAwesomeIcon icon={faUsersViewfinder} />,
  },
  {
    title: DATASET_UPDATE_DESC,
    key: "isAllowedRefreshDatasetIndex",
    icon: <FontAwesomeIcon icon={faArrowsRotate} />,
  },
  {
    title: CREATE_NEW_RELEASE_DESC,
    key: "isAllowedCreateRelease",
    icon: <FontAwesomeIcon icon={faFolderPlus} />,
  },
];

type Props = {};

/**
 * A box containing all the users in the database.
 *
 * @param pageSize
 * @constructor
 */
export const AllUsers: React.FC<Props> = () => {
  const [userTableView, setUserTableView] = useState<UserTableType>(
    UserTableType.ACTIVE
  );

  const BoxHeading = (): JSX.Element => {
    return <div>Users</div>;
  };

  return (
    <Box heading={<BoxHeading />}>
      <div className="tabs">
        <a
          onClick={() => setUserTableView(UserTableType.ACTIVE)}
          className={classNames("tab-lifted tab", {
            "tab-active": userTableView == UserTableType.ACTIVE,
          })}
        >
          Active
        </a>
        <a
          onClick={() => setUserTableView(UserTableType.INVITED)}
          className={classNames("tab-lifted tab", {
            "tab-active": userTableView == UserTableType.INVITED,
          })}
        >
          Invited
        </a>
      </div>
      {userTableView == UserTableType.ACTIVE ? (
        <ActiveUserTable />
      ) : (
        <PotentialUserTable />
      )}
    </Box>
  );
};
