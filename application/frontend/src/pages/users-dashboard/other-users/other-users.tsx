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
import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASE,
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
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
import { decodeAllowedDescription } from "../users-dashboard-page";

const permissionIconProperties: {
  key: UserPermissionType;
  title: string;
  icon: JSX.Element;
}[] = [
  {
    title: decodeAllowedDescription(ALLOWED_CHANGE_USER_PERMISSION),
    key: "isAllowedChangeUserPermission",
    icon: <FontAwesomeIcon icon={faUsersGear} />,
  },
  {
    title: decodeAllowedDescription(ALLOWED_OVERALL_ADMIN_VIEW),
    key: "isAllowedOverallAdministratorView",
    icon: <FontAwesomeIcon icon={faUsersViewfinder} />,
  },
  {
    title: decodeAllowedDescription(ALLOWED_DATASET_UPDATE),
    key: "isAllowedRefreshDatasetIndex",
    icon: <FontAwesomeIcon icon={faArrowsRotate} />,
  },
  {
    title: decodeAllowedDescription(ALLOWED_CREATE_NEW_RELEASE),
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
export const OtherUsers: React.FC<Props> = ({ pageSize }) => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
  ]);

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

  const usersWithoutMe = usersQuery?.data?.data
    ? usersQuery.data.data.filter(
        (u) => u.subjectIdentifier !== cookies[USER_SUBJECT_COOKIE_NAME]
      )
    : [];

  const baseColumnClasses = "py-4 font-medium text-gray-900";

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
          <td className={classNames(baseColumnClasses, "text-left", "w-auto")}>
            {row.displayName}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pl-4",
              "w-auto",
              "font-normal"
            )}
          >
            {row.email}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "w-40",
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
              "w-auto",
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
    <Box heading="Other Users">
      <div className="flex flex-col">
        {usersQuery.isError && <EagerErrorBoundary error={usersQuery.error} />}

        {usersQuery.isSuccess && (
          <>
            <Table
              tableHead={createHeaders()}
              tableBody={createRows(usersWithoutMe)}
            />
            <BoxPaginator
              currentPage={currentPage}
              setPage={(n) => setCurrentPage(n)}
              rowCount={currentTotal - 1}
              rowsPerPage={pageSize}
              rowWord="other users"
            />
          </>
        )}

        {usersQuery.isLoading && <IsLoadingDiv />}
      </div>
    </Box>
  );
};
