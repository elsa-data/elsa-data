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
import { usePageSizer } from "../../../hooks/page-sizer";
import { BoxPaginator } from "../../../components/box-paginator";
import { isValidEmail } from "../../../helpers/utils";

/**
 * A page allowing the display/editing of users participating in a release.
 */
export const ReleasesUserManagementPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const authorisedInviteRoles = releaseData.rolesAllowedToAlterParticipant as
    | ReleaseParticipantRoleType[]
    | null;

  const utils = trpc.useContext();

  const afterMutateForceRefresh = () => {
    utils.releaseParticipant.getParticipants.invalidate();
    setNewUserEmail("");
    setNewUserRole("Member");
  };

  const releaseParticipantsQuery =
    trpc.releaseParticipant.getParticipants.useQuery(
      {
        releaseKey,
        page: currentPage,
      },
      {
        onSuccess: (res) => {
          setCurrentTotal(res.total);
        },
      },
    );
  const participantDataList = releaseParticipantsQuery.data?.data;

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
  const isEmailValid = newUserEmail == "" || isValidEmail(newUserEmail);

  const isLoading =
    addParticipantMutate.isLoading ||
    removeParticipantMutate.isLoading ||
    releaseParticipantsQuery.isLoading;
  const isAddButtonDisabled =
    isLoading || newUserEmail.trim().length == 0 || !isEmailValid;

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
      {authorisedInviteRoles && authorisedInviteRoles.length > 0 && (
        <Box heading="Invite Participants">
          <div className="flex w-full flex-col sm:flex-row">
            <div className="rounded-box flex-grow space-y-6 text-justify sm:w-1/2">
              <p>
                New participants can be invited into this release by entering
                their organisation email here. Until they log in for the first
                time the system will only know their email address (after that,
                it will be able to refer to them by name).
              </p>
              <p>
                To modify existing users, you can use the edit button to altered
                their permission for this release. You will not able to update
                your own role.
              </p>
              <p>
                It is only possible to add/update a user in this release with
                the same level or below your own current level in the release.
              </p>
            </div>
            <div className="divider divider-vertical sm:divider-horizontal" />
            <div className="card rounded-box flex-grow justify-between">
              <div>
                <div className="form-control mb-4">
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
                        "input-error": !isEmailValid,
                        "input-accent": isEmailValid,
                      },
                    )}
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  {!isEmailValid && (
                    <label className="label">
                      <span className="label-text-alt text-red-400">
                        Invalid email
                      </span>
                    </label>
                  )}
                </div>
                {authorisedInviteRoles.map((r, idx) => (
                  <React.Fragment key={idx}>
                    {ourRadio(r, newUserRole === r, () => setNewUserRole(r))}
                  </React.Fragment>
                ))}
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
          ) : participantDataList && participantDataList.length > 0 ? (
            <>
              <Table
                tableHead={
                  <tr>
                    <th scope="col">Name</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th></th>
                  </tr>
                }
                tableBody={participantDataList.map((row: any, idx) => {
                  const {
                    role,
                    email,
                    displayName,
                    subjectId,
                    lastLogin,
                    canBeRemoved,
                    canBeRoleAltered,
                  } = row;

                  return (
                    <tr key={idx}>
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
                        <div>{role}</div>
                      </td>
                      <td>
                        {lastLogin
                          ? formatLocalDateTime(lastLogin as string)
                          : ""}
                      </td>
                      <td className="text-right">
                        <>
                          {role && canBeRoleAltered && (
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
                                  },
                                )}
                                onConfirmButtonLabel={"Remove"}
                                dialogTitle={`Remove Participant Confirmation`}
                                dialogContent={`Are you sure you want to remove "${email}" from this release?`}
                                onConfirm={() => {
                                  removeParticipantMutate.mutate({
                                    releaseKey,
                                    email: email,
                                  });
                                }}
                              />
                            </>
                          )}
                        </>
                      </td>
                    </tr>
                  );
                })}
              />
              <BoxPaginator
                currentPage={currentPage}
                setPage={(n) => setCurrentPage(n)}
                rowCount={currentTotal}
                rowsPerPage={pageSize}
                rowWord="Participants"
              />
            </>
          ) : (
            <p>There are no participants for this release</p>
          )}
        </Box>
      </>
    </>
  );
};
