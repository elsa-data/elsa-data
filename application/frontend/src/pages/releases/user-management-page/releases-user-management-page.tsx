import React, { useState } from "react";
import { EagerErrorBoundary } from "../../../components/errors";
import { Box } from "../../../components/boxes";
import {
  ReleaseParticipantRoleType,
  ReleaseParticipantType,
} from "@umccr/elsa-types";
import { IsLoadingDiv } from "../../../components/is-loading-div";
import classNames from "classnames";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { useReleasesMasterData } from "../releases-types";
import { Table } from "../../../components/tables";
import { trpc } from "../../../helpers/trpc";
import { EditParticipantRoleDialog } from "./edit-participant-role-dialog";
import ConfirmDialog from "../../../components/confirmation-dialog";

function checkEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * A page allowing the display/editing of users participating in a release.
 */
export const ReleasesUserManagementPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  const { rolesAllowedToAlterParticipant } = releaseData;

  const utils = trpc.useContext();

  const afterMutateForceRefresh = () => {
    utils.releaseParticipant.getParticipants.invalidate();
  };

  const releaseParticipantsQuery =
    trpc.releaseParticipant.getParticipants.useQuery({ releaseKey });

  const addParticipantMutate =
    trpc.releaseParticipant.addParticipant.useMutation({
      onSuccess: afterMutateForceRefresh,
    });

  const removeParticipantMutate =
    trpc.releaseParticipant.removeParticipant.useMutation({
      onSuccess: afterMutateForceRefresh,
    });

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] =
    useState<ReleaseParticipantRoleType>("Member");
  const isValidEmail = newUserEmail == "" || checkEmail(newUserEmail);

  const isLoading =
    addParticipantMutate.isLoading ||
    removeParticipantMutate.isLoading ||
    releaseParticipantsQuery.isLoading;
  const isAddButtonDisabled =
    isLoading || newUserEmail.trim().length == 0 || !isValidEmail;

  const isError =
    releaseParticipantsQuery.isError ||
    addParticipantMutate.isError ||
    removeParticipantMutate.isError;

  const error = releaseParticipantsQuery.error
    ? releaseParticipantsQuery.error
    : addParticipantMutate.error
    ? addParticipantMutate.error
    : removeParticipantMutate.error;

  const ourRadio = (text: string, checked: boolean, onChange: () => void) => (
    <div className="form-control items-start">
      <label className="label cursor-pointer">
        <input
          type="radio"
          name="roleRadio"
          className="radio-accent radio radio-sm mr-2"
          checked={checked}
          onChange={onChange}
        />
        <span className="label-text">{text}</span>
      </label>
    </div>
  );

  return (
    <>
      {isError && <EagerErrorBoundary error={error} />}
      {rolesAllowedToAlterParticipant &&
        rolesAllowedToAlterParticipant.length > 0 && (
          <Box heading="Invite New User In This Release">
            <div className="flex w-full flex-col sm:flex-row">
              <div className="card prose rounded-box grid flex-grow prose-p:space-y-2 sm:w-1/2">
                <p>
                  New users can be invited into a release by entering their
                  email here. Until they log in for the first time the system
                  will only know their email address (after that, it will be
                  able to refer to them by name).
                </p>
                <p>
                  To modify existing users, you can use the edit button to
                  altered their permission for this release.
                </p>
                <p>
                  It is only possible to add/update a user in this release with
                  a level that is one below your own current level in the
                  release.
                </p>
              </div>
              <div className="divider divider-vertical sm:divider-horizontal" />
              <div className="card rounded-box flex-grow justify-between">
                <div>
                  <div className="form-control mb-2">
                    <label className="label flex-col items-start space-y-2">
                      <span className="label-text">User Email</span>
                      <span className="label-text-alt text-xs text-slate-500">
                        Email must be their organisation's email that is used to
                        login in to Elsa (via CILogon)
                      </span>
                    </label>
                    <input
                      type="email"
                      placeholder="user@organisation.org"
                      className={classNames(
                        `input-bordered input-accent input input-sm w-full`,
                        {
                          "input-error": !isValidEmail,
                          "input-accent": isValidEmail,
                        }
                      )}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                    {!isValidEmail && (
                      <label className="label">
                        <span className="label-text-alt text-red-400">
                          Invalid email
                        </span>
                      </label>
                    )}
                  </div>
                  {ourRadio("Member", newUserRole === "Member", () =>
                    setNewUserRole("Member")
                  )}
                  {ourRadio("Manager", newUserRole === "Manager", () =>
                    setNewUserRole("Manager")
                  )}
                  {ourRadio(
                    "Administrator",
                    newUserRole === "Administrator",
                    () => setNewUserRole("Administrator")
                  )}
                </div>
                <div className="form-control my-2 max-w-full">
                  <button
                    type="button"
                    disabled={isAddButtonDisabled}
                    className={classNames("btn", {
                      "btn-disabled": isAddButtonDisabled,
                    })}
                    onClick={() => {
                      addParticipantMutate.mutate({
                        releaseKey,
                        email: newUserEmail,
                        role: newUserRole,
                      });
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </Box>
        )}

      <>
        <Box heading="User List">
          {isLoading ? (
            <IsLoadingDiv />
          ) : releaseParticipantsQuery.data &&
            releaseParticipantsQuery.data.length > 0 ? (
            <Table
              tableHead={
                <tr>
                  <th scope="col">Name</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th></th>
                </tr>
              }
              tableBody={releaseParticipantsQuery.data.map(
                (row: ReleaseParticipantType) => {
                  const {
                    id: participantUuid,
                    email,
                    displayName,
                    role: currentRole,
                    subjectId,
                    lastLogin,
                    canBeRemoved,
                    canBeRoleAltered,
                  } = row;

                  return (
                    <tr key={participantUuid}>
                      <td>
                        <div>
                          <div
                            className="font-bold"
                            title={subjectId || undefined}
                          >
                            {displayName}
                          </div>
                          {email !== displayName && (
                            <div className="text-sm opacity-50">{email}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>{currentRole}</div>
                      </td>
                      <td>
                        {lastLogin
                          ? formatLocalDateTime(lastLogin as string)
                          : ""}
                      </td>
                      <td className="text-right">
                        <>
                          {currentRole && canBeRoleAltered && (
                            <EditParticipantRoleDialog
                              releaseKey={releaseKey}
                              releaseParticipant={row}
                            />
                          )}

                          {canBeRemoved && (
                            <>
                              <span className="opacity-50">{`|`}</span>
                              <ConfirmDialog
                                openButtonLabel={`remove`}
                                openButtonClassName={classNames(
                                  "btn-table-action-danger",
                                  {
                                    "btn-disabled": isLoading,
                                  }
                                )}
                                onConfirmButtonLabel={"Remove"}
                                dialogTitle={`Remove Participant Confirmation`}
                                dialogContent={`Are you sure you want to remove "${email}" from this release?`}
                                onConfirm={() => {
                                  removeParticipantMutate.mutate({
                                    releaseKey,
                                    participantUuid: participantUuid,
                                  });
                                }}
                              />
                            </>
                          )}
                        </>
                      </td>
                    </tr>
                  );
                }
              )}
            />
          ) : (
            <p>There are no participants for this release</p>
          )}
        </Box>
      </>
    </>
  );
};
