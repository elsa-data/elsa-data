import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import {
  UserPermissionType,
  UserSummaryType,
} from "@umccr/elsa-types/schemas-users";
import { useCookies } from "react-cookie";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { EagerErrorBoundary } from "../../../components/errors";
import { EditPermissionDialog } from "./components/edit-permission-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderPlus,
  faUserPlus,
  faUsersGear,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import {
  CHANGE_USER_PERMISSION_DESC,
  CREATE_NEW_RELEASE_DESC,
  DATASET_UPDATE_DESC,
  OVERALL_ADMIN_VIEW_DESC,
} from "../helper";
import { InvitePotentialUser } from "./components/invite-potential-user";
import { ActiveUserTable } from "./components/active-user-table";
import { PotentialUser } from "../../../../../backend/dbschema/edgeql-js/modules/permission";
import { PotentialUserTable } from "./components/potential-user-table";

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
  const BoxHeading = (): JSX.Element => {
    return <div>All Users</div>;
  };

  return (
    <Box heading={<BoxHeading />}>
      <PotentialUserTable />
      <ActiveUserTable />
    </Box>
  );
};
