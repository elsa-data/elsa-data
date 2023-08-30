import {
  UserPermissionType,
  UserSummaryType,
} from "@umccr/elsa-types/schemas-users";
import React, { useState } from "react";
import classNames from "classnames";
import { BoxPaginator } from "../../../../components/box-paginator";
import { EagerErrorBoundary } from "../../../../components/errors";
import { IsLoadingDiv } from "../../../../components/is-loading-div";
import { Table } from "../../../../components/tables";
import { EditPermissionDialog } from "./edit-permission-dialog";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { ToolTip } from "../../../../components/tooltip";
import { trpc } from "../../../../helpers/trpc";
import { usePageSizer } from "../../../../hooks/page-sizer";
import { permissionIconProperties } from "../all-users";

/**
 * A box containing all users in the has logged in.
 *
 * @param pageSize
 * @constructor
 */
export const ActiveUserTable = () => {
  const pageSize = usePageSizer();

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const usersQuery = trpc.user.getActiveUsers.useQuery(
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
            <EditPermissionDialog user={row} />
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <h2 className="my-2 font-medium">Active User</h2>
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
