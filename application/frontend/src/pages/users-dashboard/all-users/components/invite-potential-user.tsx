import React, { useCallback, useRef, useState } from "react";
import {
  faCheck,
  faSpinner,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  EagerErrorBoundary,
  ErrorBoundary,
} from "../../../../components/errors";
import { SelectDialogBase } from "../../../../components/select-dialog-base";
import { trpc } from "../../../../helpers/trpc";
import classNames from "classnames";
import { isValidEmail } from "../../../../helpers/utils";
import { Alert } from "../../../../components/alert";
import { UserPermissionsInput } from "../../../../components/user/user-permissions-input";
import { useLoggedInUser } from "../../../../providers/logged-in-user-provider";

const INIT_POTENTIAL_USER = {
  potentialUserEmail: "",
  isAllowedRefreshDatasetIndex: false,
  isAllowedCreateRelease: false,
  isAllowedOverallAdministratorView: false,
  isAllowedChangeUserPermission: false,
};

export const InvitePotentialUser = () => {
  const utils = trpc.useContext();

  const loggedInUser = useLoggedInUser();
  const isEditingAllowed = loggedInUser?.isAllowedChangeUserPermission;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [input, setInput] = useState(INIT_POTENTIAL_USER);
  const resetInput = useCallback(() => {
    setInput(INIT_POTENTIAL_USER);
    invitePotentialUser.reset();
  }, []);

  // Editing/Mutation Purposes
  const invitePotentialUser = trpc.user.addPotentialUser.useMutation({
    onSuccess: async () => {
      utils.user.getPotentialUsers.invalidate();
    },
  });

  const cancelButtonRef = useRef(null);
  const cancelButton = () => {
    setIsDialogOpen(false);
  };

  const isLoadingMutate = invitePotentialUser.isLoading;

  const onInvite = useCallback(() => {
    invitePotentialUser.mutate({
      newPotentialUserEmail: input.potentialUserEmail,
      isAllowedCreateRelease: input.isAllowedCreateRelease,
      isAllowedOverallAdministratorView:
        input.isAllowedOverallAdministratorView,
      isAllowedRefreshDatasetIndex: input.isAllowedRefreshDatasetIndex,
    });
  }, [input]);

  const isPotentialEmailExist = !!input["potentialUserEmail"];
  const isPotentialEmailValid = isValidEmail(input["potentialUserEmail"]);

  return (
    <>
      <button
        className="btn-sm btn-circle btn"
        onClick={() => {
          resetInput();
          setIsDialogOpen((p) => !p);
        }}
      >
        <FontAwesomeIcon size="sm" icon={faUserPlus} />
      </button>

      <ErrorBoundary>
        <SelectDialogBase
          showing={isDialogOpen}
          cancelShowing={cancelButton}
          title="Invite Potential User"
          buttons={
            <>
              <button
                type="button"
                disabled={
                  isLoadingMutate ||
                  !isPotentialEmailValid ||
                  invitePotentialUser.isSuccess ||
                  !isEditingAllowed
                }
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onInvite}
              >
                {isLoadingMutate && (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                )}
                Invite
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
                  This popup will enable the addition of users who can log in to
                  the system. Only users on the approved list will have access
                  to log in.
                </p>
              </div>
              {invitePotentialUser.isSuccess ? (
                <div className="mt-4">
                  <Alert
                    description={`Successfully invite: ${input.potentialUserEmail}`}
                    icon={<FontAwesomeIcon icon={faCheck} />}
                    additionalAlertClassName={
                      "alert-success bg-green-200 text-xs py-1"
                    }
                  />
                  <div
                    onClick={resetInput}
                    className="mt-4 flex cursor-pointer justify-center underline underline-offset-2"
                  >
                    Invite more
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex w-full flex-col">
                  {invitePotentialUser.isError && (
                    <EagerErrorBoundary error={invitePotentialUser.error} />
                  )}
                  <div className="card rounded-box flex-grow ">
                    <h3 className="font-semibold">User Details</h3>
                    <p className="prose mt-2 text-sm text-gray-500">
                      {`We require the email to match in order to add it to our authorized logging list.`}
                    </p>
                    <div className="mt-1">
                      <label className="label">
                        <span className="label-text text-sm font-medium">
                          {`Email`}
                        </span>
                      </label>
                      <input
                        disabled={!isEditingAllowed}
                        value={input["potentialUserEmail"]}
                        type="text"
                        className={classNames("input input-sm !m-0 w-full ", {
                          "border-slate-400": !isPotentialEmailExist,
                          "input-error":
                            isPotentialEmailExist && !isPotentialEmailValid,
                          "input-accent":
                            isPotentialEmailExist && isPotentialEmailValid,
                        })}
                        onChange={(e) =>
                          setInput((p) => ({
                            ...p,
                            potentialUserEmail: e.target.value.trim(), // .trim() for trailing spaces
                          }))
                        }
                      />
                      {isPotentialEmailExist && !isPotentialEmailValid && (
                        <label className="label">
                          <span className="label-text-alt text-red-400">
                            Invalid email
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="card rounded-box flex-grow">
                    <div className="mt-8 mb-2 flex  flex-col">
                      <h3 className="font-semibold">User Permission</h3>
                      <p className="prose mt-2 text-sm text-gray-500">
                        When inviting a new user, you can configure the initial
                        permissions they will have.
                      </p>
                    </div>

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
              )}
            </>
          }
          initialFocus={cancelButtonRef}
        />
      </ErrorBoundary>
    </>
  );
};
