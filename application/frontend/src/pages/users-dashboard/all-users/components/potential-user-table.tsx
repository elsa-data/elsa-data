import React, { useState } from "react";
import {
  PotentialUserSummaryType,
  UserPermissionType,
} from "@umccr/elsa-types/schemas-users";
import classNames from "classnames";
import { BoxPaginator } from "../../../../components/box-paginator";
import { EagerErrorBoundary } from "../../../../components/errors";
import { IsLoadingDiv } from "../../../../components/is-loading-div";
import { Table } from "../../../../components/tables";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { ToolTip } from "../../../../components/tooltip";
import { trpc } from "../../../../helpers/trpc";
import { usePageSizer } from "../../../../hooks/page-sizer";
import {
  OVERALL_ADMIN_VIEW_DESC,
  DATASET_UPDATE_DESC,
  CREATE_NEW_RELEASE_DESC,
} from "../../helper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderPlus,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import { InvitePotentialUser } from "./invite-potential-user";
import { EditPotentialUserPermissionDialog } from "./edit-potential-user-permission-dialog";

export const permissionIconProperties: {
  key:
    | "isAllowedOverallAdministratorView"
    | "isAllowedRefreshDatasetIndex"
    | "isAllowedCreateRelease";
  title: string;
  icon: JSX.Element;
}[] = [
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

/**
 * A box containing all users in the has logged in.
 *
 * @param pageSize
 * @constructor
 */
export const PotentialUserTable = () => {
  const pageSize = usePageSizer();

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const usersQuery = trpc.user.getPotentialUsers.useQuery(
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
          Email
        </th>
        <th scope="col" className="table-cell">
          Created
        </th>
        <th scope="col" className="table-cell text-right">
          Permissions
        </th>
      </tr>
    );
  };

  const createRows = (data: PotentialUserSummaryType[]) => {
    return data.map((row, rowIndex) => {
      return (
        <tr key={rowIndex} className="border-b pl-2 pr-2">
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
            {formatLocalDateTime(row.createdDateTime as string | undefined)}
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
            <EditPotentialUserPermissionDialog
              user={{
                email: row.email,
                isAllowedChangeUserPermission: false,
                isAllowedCreateRelease: row.isAllowedCreateRelease,
                isAllowedRefreshDatasetIndex: row.isAllowedRefreshDatasetIndex,
                isAllowedOverallAdministratorView:
                  row.isAllowedOverallAdministratorView,
              }}
            />
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <div className="my-2 flex w-full flex-row items-center justify-between">
        <h2 className="my-2 font-medium">Potential User</h2>
        <div>
          <InvitePotentialUser />
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        {`This table shows users who have been invited but haven't logged in yet. Only those in 
          this list can log in. Only release administrator and person who has the right to change 
          other people permissions can send invitations to this list.`}
      </p>
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
  );
};
