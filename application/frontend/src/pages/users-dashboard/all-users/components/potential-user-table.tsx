import React, { useState } from "react";
import { PotentialUserSummaryType } from "../../../../../../backend/src/shared/schemas-users";
import classNames from "classnames";
import { BoxPaginator } from "../../../../components/box-paginator";
import { EagerErrorBoundary } from "../../../../components/errors";
import { IsLoadingDiv } from "../../../../components/is-loading-div";
import { Table } from "../../../../components/tables";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { ToolTip } from "../../../../components/tooltip";
import { usePageSizer } from "../../../../hooks/page-sizer";
import {
  OVERALL_ADMIN_VIEW_DESC,
  DATASET_UPDATE_DESC,
  CREATE_NEW_RELEASE_DESC,
} from "../../helper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCheck,
  faFolderPlus,
  faUsersViewfinder,
} from "@fortawesome/free-solid-svg-icons";
import { InvitePotentialUser } from "./invite-potential-user";
import { EditPotentialUserPermissionDialog } from "./edit-potential-user-permission-dialog";
import { useLoggedInUser } from "../../../../providers/logged-in-user-provider";
import ConfirmDialog from "../../../../components/confirmation-dialog";
import { Alert } from "../../../../components/alert";
import { useTRPC } from "../../../../helpers/trpc-modern.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
 * A box containing all users that have been invited but not yet on the system.
 *
 * @constructor
 */
export const PotentialUserTable = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const pageSize = usePageSizer();

  const loggedInUser = useLoggedInUser();

  // Some boolean values for component to show or not
  const isEditingAllowed = !!loggedInUser?.isAllowedChangeUserPermission;

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  const potentialUsersQueryOptions = trpc.user.getPotentialUsers.queryOptions({
    page: currentPage,
  });
  const potentialUsersQuery = useQuery(potentialUsersQueryOptions);

  const removePotentialUserMutateOptions =
    trpc.user.removePotentialUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    });
  const removePotentialUserMutate = useMutation(
    removePotentialUserMutateOptions,
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
            {formatLocalDateTime(row.createdDateTime as string | undefined)}
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
            {isEditingAllowed && (
              <>
                <span className="opacity-50">{`|`}</span>
                <ConfirmDialog
                  openButtonLabel={`remove`}
                  openButtonClassName={classNames("btn-table-action-danger", {
                    "btn-disabled": removePotentialUserMutate.isPending,
                  })}
                  onConfirmButtonLabel={"Remove"}
                  dialogTitle={`Remove Potential User Confirmation`}
                  dialogContent={`Are you sure you want to remove "${row.email}"?`}
                  onConfirm={() => {
                    removePotentialUserMutate.mutate({
                      potentialUserEmail: row.email,
                    });
                  }}
                />
              </>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <div className="my-2 flex w-full flex-row items-center justify-between">
        <h2 className="my-2 font-medium">Invited User</h2>
        <div>
          <InvitePotentialUser />
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        This table shows users who have been invited but haven't logged in yet.
        Only those in this list can log in. Invitations can only be sent by
        release administrators and individuals who has the right to change other
        people permissions.
      </p>
      {removePotentialUserMutate.isSuccess && (
        <Alert
          description={`Participant successfully removed.`}
          icon={<FontAwesomeIcon icon={faCheck} />}
          additionalAlertClassName={
            "alert-success bg-green-200 text-xs py-1 mb-2"
          }
        />
      )}
      {potentialUsersQuery.isError && (
        <EagerErrorBoundary error={potentialUsersQuery.error} />
      )}
      {removePotentialUserMutate.isError && (
        <EagerErrorBoundary error={removePotentialUserMutate.error} />
      )}
      {potentialUsersQuery.isSuccess && (
        <>
          <Table
            tableHead={createHeaders()}
            tableBody={createRows(potentialUsersQuery?.data?.data ?? [])}
          />
          <BoxPaginator
            currentPage={currentPage}
            setPage={(n) => setCurrentPage(n)}
            rowCount={potentialUsersQuery.data.total}
            rowsPerPage={pageSize}
            rowWord="invited users"
          />
        </>
      )}
      {potentialUsersQuery.isLoading && <IsLoadingDiv />}
    </div>
  );
};
