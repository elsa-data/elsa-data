import React, { useEffect, useRef, useState } from "react";
import {
  EagerErrorBoundary,
  ErrorBoundary,
} from "../../../../components/errors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SelectDialogBase } from "../../../../components/select-dialog-base";
import { trpc } from "../../../../helpers/trpc";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";
import { Alert } from "../../../../components/alert";
import { useLoggedInUser } from "../../../../providers/logged-in-user-provider";
import { DisplayUserInformation } from "../../../../components/user/display-user-information";
import {
  convertUserPropToPermissionState,
  UserPermissionsInput,
} from "../../../../components/user/user-permissions-input";
import { SuccessCancelButtons } from "../../../../components/success-cancel-buttons";

type UserProps = {
  email: string;
  isAllowedChangeUserPermission: boolean;
  isAllowedCreateRelease: boolean;
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedOverallAdministratorView: boolean;
};

export const EditPotentialUserPermissionDialog: React.FC<{
  user: UserProps;
}> = ({ user }) => {
  const loggedInUser = useLoggedInUser();
  const utils = trpc.useContext();

  // Some boolean values for component to show or not
  const isEditingAllowed = loggedInUser?.isAllowedChangeUserPermission;
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);

  // A function when dialog is closed
  const cancelButtonRef = useRef(null);
  const cancelButton = () => {
    setIsDialogOpen(false);
    setIsEditingMode(false);
  };

  // Input state for checkbox and updated when needed.
  // e.g. Dialog open, editing mode button clicked, or user value changed will refresh the input state
  const [input, setInput] = useState(convertUserPropToPermissionState(user));
  useEffect(() => {
    if (isDialogOpen && !isEditingMode)
      setInput(convertUserPropToPermissionState(user));
  }, [isDialogOpen, isEditingMode, user]);

  // Editing/Mutation Purposes
  const changeUserPermissionMutate =
    trpc.user.changePotentialUserPermission.useMutation({
      onSettled: async () => {
        setIsEditingMode(false);
      },
      onSuccess: async () => {
        await utils.user.getPotentialUsers.invalidate();
      },
    });

  const isLoadingMutatePermission = changeUserPermissionMutate.isLoading;

  return (
    <>
      <button
        className="btn-table-action-navigate btn"
        onClick={() => setIsDialogOpen((p) => !p)}
      >
        edit
      </button>
      <ErrorBoundary>
        <SelectDialogBase
          showing={isDialogOpen}
          cancelShowing={cancelButton}
          title="User Configuration"
          buttons={
            <>
              {isEditingAllowed && (
                <SuccessCancelButtons
                  isLoading={isLoadingMutatePermission}
                  isSuccessDisabled={
                    isLoadingMutatePermission ||
                    _.isEqual(input, convertUserPropToPermissionState(user))
                  }
                  successButtonLabel={"Save"}
                  onSuccess={() => {
                    changeUserPermissionMutate.mutate({
                      potentialUserEmail: user.email,
                      ...input,
                    });
                  }}
                  cancelButtonLabel={"Cancel"}
                  onCancel={cancelButton}
                  cancelButtonRef={cancelButtonRef}
                />
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
                  <DisplayUserInformation user={user} />
                </div>

                <div className="card rounded-box flex-grow ">
                  <div className="mt-8 mb-2 flex">
                    <h3 className="font-semibold">User Permission</h3>
                  </div>

                  {changeUserPermissionMutate.isError && (
                    <EagerErrorBoundary
                      error={changeUserPermissionMutate.error}
                    />
                  )}
                  {!isEditingAllowed && (
                    <div className="w-full bg-amber-100 py-2 text-center text-xs">
                      You are only allowed to view this section.
                    </div>
                  )}
                  {changeUserPermissionMutate.isSuccess && (
                    <Alert
                      description={"Permissions changed successfully."}
                      icon={<FontAwesomeIcon icon={faCheck} />}
                      additionalAlertClassName={
                        "alert-success bg-green-200 text-xs py-1"
                      }
                    />
                  )}
                  <UserPermissionsInput
                    isDisabled={!isEditingAllowed}
                    permissionProps={input}
                    onPermissionChange={(newChange) => {
                      setInput((p) => ({
                        ...p,
                        ...newChange,
                      }));
                    }}
                  />
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
