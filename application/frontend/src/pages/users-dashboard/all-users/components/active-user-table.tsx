import { UserSummaryType } from "../../../../../../backend/src/shared/schemas-users";
import React, { useState } from "react";
import classNames from "classnames";
import { BoxPaginator } from "../../../../components/box-paginator";
import { EagerErrorBoundary } from "../../../../components/errors";
import { IsLoadingDiv } from "../../../../components/is-loading-div";
import { Table } from "../../../../components/tables";
import { EditActiveUserPermissionDialog } from "./edit-active-user-permission-dialog";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { ToolTip } from "../../../../components/tooltip";
import { usePageSizer } from "../../../../hooks/page-sizer";
import { permissionIconProperties } from "../all-users";
import { useTRPC } from "../../../../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

/**
 * A box containing all users in the has logged in.
 *
 * @constructor
 */
export const ActiveUserTable = () => {
  const pageSize = usePageSizer();
  const trpc = useTRPC();

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  const usersQueryOptions = trpc.user.getActiveUsers.queryOptions({
    page: currentPage,
  });

  const usersQuery = useQuery(usersQueryOptions);

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
              "font-normal",
            )}
          >
            {row.email}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pr-4",
              "font-normal",
            )}
          >
            {formatLocalDateTime(row.lastLogin as string | undefined)}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-right",
              "pl-4",
              "font-normal",
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
            <EditActiveUserPermissionDialog user={row} />
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <h2 className="my-2 font-medium">Active User</h2>

      <p className="prose mb-4 text-sm text-gray-500">
        {`This table will display a list of active users (those that have logged in at least once) along with their permissions.`}
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
            rowCount={usersQuery.data.total}
            rowsPerPage={pageSize}
            rowWord="active users"
          />
        </>
      )}

      {usersQuery.isLoading && <IsLoadingDiv />}
    </div>
  );
};
