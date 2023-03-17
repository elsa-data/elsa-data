import React, { useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { Box } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import { useCookies } from "react-cookie";
import {
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import {
  EagerErrorBoundary,
  ErrorBoundary,
  ErrorState,
} from "../../../components/errors";
import { handleTotalCountHeaders } from "../../../helpers/paging-helper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { trpc } from "../../../helpers/trpc";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// Column for User Information
type userKey = "id" | "email" | "displayName" | "subjectIdentifier";
const userInfoProperties: { label: string; key: userKey }[] = [
  {
    label: "Name",
    key: "displayName",
  },
  {
    label: "Email",
    key: "email",
  },
  {
    label: "Subject Identifier",
    key: "subjectIdentifier",
  },
];

// Column for User Permissions
type permissionType =
  | "isAllowedChangeUserPermission"
  | "isAllowedRefreshDatasetIndex"
  | "isAllowedCreateRelease"
  | "isAllowedElsaAdminView";
const permissionOptionProperties: {
  key: permissionType;
  labelHTML: JSX.Element;
  disabled?: boolean;
}[] = [
  {
    labelHTML: (
      <div className="text-sm">
        <div className="font-medium">
          Allow user to change other user's permission.
        </div>
        <div className="text-xs text-gray-500">
          It can only be changed by an app administrator.
        </div>
      </div>
    ),
    key: "isAllowedChangeUserPermission",
    disabled: true,
  },
  {
    labelHTML: (
      <div className="text-sm">
        <div className="font-medium">Allow user to refresh dataset index</div>
      </div>
    ),
    key: "isAllowedRefreshDatasetIndex",
  },
  {
    labelHTML: (
      <div className="text-sm">
        <div className="font-medium">
          Allow user to create and become a release administrator.
        </div>
      </div>
    ),
    key: "isAllowedCreateRelease",
  },
  {
    labelHTML: (
      <div className="text-sm">
        <div className="font-medium">
          Allow user to view as an Elsa-Data administrator.
        </div>
        <div className="text-xs text-gray-500">
          Will be able to view all Datasets, Releases, and Audit Events.
        </div>
      </div>
    ),
    key: "isAllowedElsaAdminView",
  },
];

type Props = {
  user: UserSummaryType;
};
export const PermissionDialog: React.FC<Props> = ({ user }) => {
  const queryClient = useQueryClient();
  const cancelButtonRef = useRef(null);

  const [permission, setPermission] = useState({
    isAllowedChangeUserPermission: user.isAllowedChangeUserPermission,
    isAllowedRefreshDatasetIndex: user.isAllowedRefreshDatasetIndex,
    isAllowedCreateRelease: user.isAllowedCreateRelease,
    isAllowedElsaAdminView: user.isAllowedElsaAdminView,
  });

  const [lastMutateError, setLastMutateError] = useState<string | undefined>(
    undefined
  );
  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const cancelButton = () => setIsDialogOpen(false);

  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
  ]);

  const changeUserPermissionMutate = trpc.user.changeUserPermission.useMutation(
    {
      onSettled: async () => await queryClient.invalidateQueries(),
      onError: (error: any) => setError({ error, isSuccess: false }),
      onSuccess: () => setError({ error: null, isSuccess: true }),
    }
  );
  const onSave = () =>
    changeUserPermissionMutate.mutate({ userEmail: user.email, ...permission });
  const isLoadingMutatePermission = changeUserPermissionMutate.isLoading;

  return (
    <>
      <button
        className="btn-outline btn-xs btn-circle btn"
        onClick={() => setIsDialogOpen((p) => !p)}
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </button>
      <ErrorBoundary styling={"bg-red-100"}>
        <SelectDialogBase
          showing={isDialogOpen}
          cancelShowing={cancelButton}
          title="User Configuration"
          buttons={
            <>
              <button
                type="button"
                disabled={
                  isLoadingMutatePermission ||
                  user.isAllowedChangeUserPermission
                }
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onSave}
              >
                {isLoadingMutatePermission && (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                )}
                Save
              </button>
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={cancelButton}
                ref={cancelButtonRef}
              >
                Cancel
              </button>
            </>
          }
          content={
            <>
              <div className="prose mt-2">
                <p className="text-sm text-gray-500">
                  This popup will show user information along with permissions
                  associated with their account.
                </p>
              </div>

              <div className="mt-4 flex w-full flex-col">
                <div className="card rounded-box flex-grow ">
                  <h3 className="font-semibold">User Information</h3>
                  {userInfoProperties.map((o, idx) => (
                    <div key={o.key} className="mt-1">
                      <label className="label">
                        <span className="label-text text-sm font-medium">
                          {o.label}
                        </span>
                      </label>
                      <input
                        value={user[o.key]}
                        type="text"
                        className="input-bordered input input-sm !m-0 w-full "
                        disabled
                      />
                    </div>
                  ))}
                </div>

                <div className="card rounded-box flex-grow ">
                  <h3 className="mt-8 font-semibold">User Permission</h3>
                  {permissionOptionProperties.map((o, index) => {
                    const disabledClassName = o.disabled && "!text-gray-500";

                    return (
                      <label
                        key={index}
                        className={`my-2 flex content-center items-center pl-2 text-gray-800 ${disabledClassName}`}
                      >
                        <input
                          disabled={o.disabled}
                          className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
                          type="checkbox"
                          value={o.key}
                          checked={permission[o.key] == true}
                          onChange={() => {
                            const newChange: Record<string, boolean> = {};
                            newChange[o.key] = !permission[o.key];
                            setPermission((p) => ({
                              ...p,
                              ...newChange,
                            }));
                          }}
                        />
                        {o.labelHTML}
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          }
          errorMessage={lastMutateError}
          initialFocus={cancelButtonRef}
        />
      </ErrorBoundary>
    </>
  );
};
