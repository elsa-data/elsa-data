import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { Box } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import {
  UserPermissionType,
  UserSummaryType,
} from "@umccr/elsa-types/schemas-users";
import { useCookies } from "react-cookie";
import {
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { EagerErrorBoundary } from "../../../components/errors";
import { handleTotalCountHeaders } from "../../../helpers/paging-helper";
import { PermissionDialog } from "./permission-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderPlus,
  faUsersGear,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import { Table } from "../../../components/tables";

const permissionIconProperties: {
  key: UserPermissionType;
  title: string;
  icon: JSX.Element;
}[] = [
  {
    title: "Allow user to create and become a release administrator.",
    key: "isAllowedCreateRelease",
    icon: <FontAwesomeIcon icon={faFolderPlus} />,
  },
  {
    title: "Allow user to update/refresh dataset index.",
    key: "isAllowedRefreshDatasetIndex",
    icon: <FontAwesomeIcon icon={faArrowsRotate} />,
  },
  {
    title: "Allow user to view as an app administrator.",
    key: "isAllowedOverallAdministratorView",
    icon: <FontAwesomeIcon icon={faUsersViewfinder} />,
  },
  {
    title: "Allow user to change other user's permissions.",
    key: "isAllowedChangeUserPermission",
    icon: <FontAwesomeIcon icon={faUsersGear} />,
  },
];

type Props = {
  // the (max) number of users shown on any single page
  pageSize: number;
};

export const OtherUsers: React.FC<Props> = ({ pageSize }) => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
  ]);

  const dataQuery = useQuery(
    ["users", currentPage],
    async () => {
      return await axios
        .get<UserSummaryType[]>(`/api/users?page=${currentPage}`)
        .then((response) => {
          const usersWithoutMe = response.data.filter(
            (u) => u.subjectIdentifier !== cookies[USER_SUBJECT_COOKIE_NAME]
          );

          handleTotalCountHeaders(response, setCurrentTotal);

          return usersWithoutMe;
        });
    },
    { keepPreviousData: true }
  );

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
                {row[prop.key] == true && (
                  <span key={prop.key} className="mx-1" title={prop.title}>
                    {prop.icon}
                  </span>
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
    <Box
      heading="Other Users"
      errorMessage={"Something went wrong fetching users."}
    >
      <div className="flex flex-col">
        <Table
          tableHead={createHeaders()}
          tableBody={dataQuery.isSuccess && createRows(dataQuery.data)}
        />

        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotal - 1}
          rowsPerPage={pageSize}
          rowWord="other users"
        />
        {dataQuery.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching users."}
            error={dataQuery.error}
            styling={"bg-red-100"}
          />
        )}
      </div>
    </Box>
  );
};
