import React, { useCallback, useEffect, useRef, useState } from "react";
import { UserPermissionType } from "@umccr/elsa-types/schemas-users";
import { ALLOWED_CHANGE_USER_PERMISSION } from "@umccr/elsa-constants";
import {
  EagerErrorBoundary,
  ErrorBoundary,
  ErrorState,
} from "../../../components/errors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { trpc } from "../../../helpers/trpc";
import { faSpinner, faUserGear } from "@fortawesome/free-solid-svg-icons";
import { useUiAllowed } from "../../../hooks/ui-allowed";
import { useQueryClient } from "@tanstack/react-query";

// Column for User Information
type userKey = "email" | "displayName" | "subjectIdentifier";
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

const permissionOptionProperties: {
  key: UserPermissionType;
  disabled?: boolean;
  title: string;
  description?: string;
}[] = [
  {
    title: "Allow user to create and become a release administrator.",
    key: "isAllowedCreateRelease",
  },
  {
    title: "Allow user to update/refresh dataset index.",
    key: "isAllowedRefreshDatasetIndex",
  },
  {
    title: "Allow user to view as an app administrator.",
    description:
      "Will be able to view all Datasets, Releases, and Audit Events.",
    key: "isAllowedOverallAdministratorView",
  },
  {
    title: "Allow user to change other user's permissions.",
    description: "It can only be modified within the app configuration.",
    key: "isAllowedChangeUserPermission",
    disabled: true,
  },
];

// A function converting user props to checkbox format useState
const convertUserPropToPermissionState = (u: UserProps) => ({
  isAllowedChangeUserPermission: u.isAllowedChangeUserPermission,
  isAllowedRefreshDatasetIndex: u.isAllowedRefreshDatasetIndex,
  isAllowedCreateRelease: u.isAllowedCreateRelease,
  isAllowedOverallAdministratorView: u.isAllowedOverallAdministratorView,
});

type UserProps = {
  displayName: string;
  email: string;
  subjectIdentifier: string;
  isAllowedChangeUserPermission: boolean;
  isAllowedCreateRelease: boolean;
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedOverallAdministratorView: boolean;
};
export const PermissionDialog: React.FC<{ user: UserProps }> = ({ user }) => {
  const queryClient = useQueryClient();

  // Check if user allowed to do some editing
  const uiAllowed = useUiAllowed();
  const isEditingAllowed = uiAllowed.has(ALLOWED_CHANGE_USER_PERMISSION);

  // Some boolean values for component to show or not
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isInputDisable = !isEditingAllowed || !isEditingMode;

  // A function when dialog is closed
  const cancelButtonRef = useRef(null);
  const cancelButton = () => {
    setIsDialogOpen(false);
    setIsSuccess(false);
    setIsEditingMode(false);
  };

  // Input state for checkbox and updated when needed.
  // e.g. Dialog open, editing mode button clicked, or user value changed will refresh the input state
  const [input, setInput] = useState(convertUserPropToPermissionState(user));
  useEffect(() => {
    if (isDialogOpen && !isEditingMode)
      setInput(convertUserPropToPermissionState(user));
  }, [isDialogOpen, isEditingMode, user]);

  // ERROR states
  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  // Editing/Mutation Purposes
  const changeUserPermissionMutate = trpc.user.changeUserPermission.useMutation(
    {
      onSettled: async () => {
        setIsEditingMode(false);
        await queryClient.invalidateQueries();
      },
      onError: (error: any) => setError({ error, isSuccess: false }),
      onSuccess: () => {
        setIsSuccess(true);
        setError({ error: null, isSuccess: true });
      },
    }
  );

  const onSave = useCallback(() => {
    changeUserPermissionMutate.mutate({ userEmail: user.email, ...input });
  }, [changeUserPermissionMutate.mutate, input]);
  const isLoadingMutatePermission = changeUserPermissionMutate.isLoading;

  return (
    <>
      <button
        className="btn-outline btn-xs btn-circle btn"
        onClick={() => setIsDialogOpen((p) => !p)}
      >
        <FontAwesomeIcon icon={faUserGear} />
      </button>
      <ErrorBoundary styling={"bg-red-100"}>
        <SelectDialogBase
          showing={isDialogOpen}
          cancelShowing={cancelButton}
          title="User Configuration"
          buttons={
            <>
              {!isInputDisable && (
                <>
                  <button
                    type="button"
                    disabled={isLoadingMutatePermission}
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
              )}
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
                  <div className="mt-8 mb-2 flex">
                    <h3 className="font-semibold">User Permission</h3>

                    {isEditingAllowed && (
                      <button
                        className="btn-outline btn-xs btn-circle btn ml-2"
                        onClick={() => {
                          setIsSuccess(false);
                          setIsEditingMode((p) => !p);
                        }}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                    )}
                  </div>

                  {!isEditingAllowed && (
                    <div className="w-full bg-amber-100 py-2 text-center text-xs">
                      You are only allowed to view this section.
                    </div>
                  )}
                  {isSuccess && (
                    // For temporary, user need to re-logged in order to get latest permission in their UI.
                    <div className="w-full bg-green-200 py-2 text-center text-xs">
                      {`Permissions changed successfully.`}
                    </div>
                  )}

                  {!error.isSuccess && (
                    <EagerErrorBoundary
                      message={
                        "Something went wrong mutating user's permissions."
                      }
                      error={error.error}
                      styling={"bg-red-100"}
                    />
                  )}

                  {permissionOptionProperties.map((o, index) => {
                    const disabledClassName =
                      (o.disabled || isInputDisable) && "!text-gray-500";

                    return (
                      <label
                        key={index}
                        className={`my-2 flex content-center items-center pl-2 text-gray-800 ${disabledClassName}`}
                      >
                        <input
                          disabled={o.disabled || isInputDisable}
                          className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
                          type="checkbox"
                          value={o.key}
                          checked={input[o.key] == true}
                          onChange={() => {
                            const newChange: Record<string, boolean> = {};
                            newChange[o.key] = !input[o.key];
                            setInput((p) => ({
                              ...p,
                              ...newChange,
                            }));
                          }}
                        />
                        <div className="text-sm">
                          <div className="font-medium">{o.title}</div>
                          {o.description && (
                            <div className="text-xs text-gray-500">
                              {o.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          }
          initialFocus={cancelButtonRef}
        />
      </ErrorBoundary>
    </>
  );
};
