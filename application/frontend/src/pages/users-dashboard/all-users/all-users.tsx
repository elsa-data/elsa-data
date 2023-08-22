import React, { useState } from "react";
import { trpc } from "../../../helpers/trpc";
import classNames from "classnames";
import { Box } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import {
  UserPermissionType,
  UserSummaryType,
} from "@umccr/elsa-types/schemas-users";
import { useCookies } from "react-cookie";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { EagerErrorBoundary } from "../../../components/errors";
import { PermissionDialog } from "./permission-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderPlus,
  faUsersGear,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import { Table } from "../../../components/tables";
import { IsLoadingDiv } from "../../../components/is-loading-div";
import { ToolTip } from "../../../components/tooltip";
import {
  CHANGE_USER_PERMISSION_DESC,
  CREATE_NEW_RELEASE_DESC,
  DATASET_UPDATE_DESC,
  OVERALL_ADMIN_VIEW_DESC,
} from "../text-helper";

const permissionIconProperties: {
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

type Props = {
  // the (max) number of users shown on any single page
  pageSize: number;
};

/**
 * A box containing all the users in the database that are *not* the logged in user
 * (whose details are displayed elsewhere).
 *
 * @param pageSize
 * @constructor
 */
export const AllUsers: React.FC<Props> = ({ pageSize }) => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const usersQuery = trpc.user.getUsers.useQuery(
    {
      page: currentPage,
    },
    {
      keepPreviousData: true,
      onSuccess: (res) => {
        if (!res) return undefined;

        // use the total
        setCurrentTotal(res.total);
      },
    }
  );

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  const createHeaders = () => {
    return (
      <tr>
        <th scope="col" className="table-cell">
          Name
        </th>
        <th scope="col" className="table-cell">
          Email
        </th>
        <th scope="col" className="table-cell">
          Last Logged In
        </th>
        <th scope="col" className="table-cell text-right">
          Permissions
        </th>
      </tr>
    );
  };

  const createRows = (data: UserSummaryType[]) => {
    return data.map((row, rowIndex) => {
      return (
        <tr key={rowIndex} className="border-b pl-2 pr-2">
          <td className={classNames(baseColumnClasses, "text-left")}>
            {row.displayName}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pl-4",
              "font-normal"
            )}
          >
            {row.email}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pr-4",
              "font-normal"
            )}
          >
            {formatLocalDateTime(row.lastLogin as string | undefined)}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-right",
              "pl-4",
              "font-normal"
            )}
          >
            {permissionIconProperties.map((prop) => (
              <React.Fragment key={prop.key}>
                {row[prop.key] && (
                  <ToolTip
                    key={prop.key}
                    applyCSS={"tooltip-left mx-1"}
                    trigger={prop.icon}
                    description={prop.title}
                  />
                )}
              </React.Fragment>
            ))}
            <PermissionDialog user={row} />
          </td>
        </tr>
      );
    });
  };

  return (
    <Box heading="All Users">
      <div className="flex flex-col">
        {usersQuery.isError && <EagerErrorBoundary error={usersQuery.error} />}

        {usersQuery.isSuccess && (
          <>
            <Table
              tableHead={createHeaders()}
              tableBody={createRows(usersQuery?.data?.data ?? [])}
            />
            <BoxPaginator
              currentPage={currentPage}
              setPage={(n) => setCurrentPage(n)}
              rowCount={currentTotal}
              rowsPerPage={pageSize}
              rowWord="all users"
            />
          </>
        )}

        {usersQuery.isLoading && <IsLoadingDiv />}
      </div>
    </Box>
  );
};
