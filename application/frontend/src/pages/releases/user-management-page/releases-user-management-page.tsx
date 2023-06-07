import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseParticipantsQuery,
} from "../queries";
import { EagerErrorBoundary, ErrorState } from "../../../components/errors";
import { Box } from "../../../components/boxes";
import { ReleasesBreadcrumbsDiv } from "../releases-breadcrumbs-div";
import { ReleaseParticipantType } from "@umccr/elsa-types";
import { IsLoadingDiv } from "../../../components/is-loading-div";
import classNames from "classnames";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import axios from "axios";
import { useReleasesMasterData } from "../releases-types";
import { useLoggedInUser } from "../../../providers/logged-in-user-provider";
import { Table } from "../../../components/tables";

/**
 * A page allowing the display/editing of users participating in a release.
 */
export const ReleasesUserManagementPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const releaseParticipantsQuery = useQuery<ReleaseParticipantType[]>({
    queryKey: REACT_QUERY_RELEASE_KEYS.participant(releaseKey),
    queryFn: specificReleaseParticipantsQuery,
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
  });

  const queryClient = useQueryClient();

  const afterMutateForceRefresh = () => {
    return queryClient.invalidateQueries(
      REACT_QUERY_RELEASE_KEYS.participant(releaseKey)
    );
  };

  const addUserMutate = useMutation(
    (c: {
      newUserEmail: string;
      newUserRole: "Manager" | "Member" | "Administrator";
    }) =>
      axios.post<void>(`/api/releases/${releaseKey}/participants`, {
        email: c.newUserEmail,
        role: c.newUserRole,
      }),
    { onSuccess: afterMutateForceRefresh }
  );

  const removeUserMutate = useMutation(
    (participantId: string) =>
      axios.delete<void>(
        `/api/releases/${releaseKey}/participants/${participantId}`
      ),
    { onSuccess: afterMutateForceRefresh }
  );

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<
    "Member" | "Manager" | "Administrator"
  >("Member");

  const isAddButtonDisabled =
    addUserMutate.isLoading ||
    removeUserMutate.isLoading ||
    newUserEmail.trim().length == 0;

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
      <Box heading="Add/Update User In This Release">
        <form className="prose-xs prose max-w-2xl">
          <p>
            New users can be invited into a release by entering their email
            here. Until they log in for the first time the system will only know
            their email address (after that, it will be able to refer to them by
            name).
          </p>
          <p>
            Existing users can have their permissions altered by entering their
            email and setting their new permission level.
          </p>
          <p>
            It is only possible to add/update a user in this release with a
            level that is one below your own current level in the release. (TO
            BE IMPLEMENTED)
          </p>
          <div className="form-control">
            <label className="label">
              <span className="label-text">User Email</span>
            </label>
            <input
              type="text"
              placeholder="email@address"
              className="input-bordered input-accent input input-sm w-full"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          {ourRadio("Member", newUserRole === "Member", () =>
            setNewUserRole("Member")
          )}
          {ourRadio("Manager", newUserRole === "Manager", () =>
            setNewUserRole("Manager")
          )}
          {ourRadio("Administrator", newUserRole === "Administrator", () =>
            setNewUserRole("Administrator")
          )}
          <div className="form-control max-w-xs">
            <button
              type="button"
              disabled={isAddButtonDisabled}
              className={classNames("btn", {
                "btn-disabled": isAddButtonDisabled,
              })}
              onClick={async () => {
                addUserMutate.mutate({
                  newUserEmail: newUserEmail,
                  newUserRole: newUserRole,
                });
              }}
            >
              Add / Update
            </button>
          </div>
        </form>
      </Box>

      {!error.isSuccess && (
        <EagerErrorBoundary
          error={error.error}
        />
      )}

      {releaseParticipantsQuery.isSuccess && (
        <>
          <Box heading="User List">
            {releaseParticipantsQuery.isLoading && <IsLoadingDiv />}
            {releaseParticipantsQuery.data &&
              releaseParticipantsQuery.data.length === 0 && (
                <p>There are no participants for this release</p>
              )}
            {releaseParticipantsQuery.data &&
              releaseParticipantsQuery.data.length > 0 && (
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
                    (row, rowIndex) => {
                      return (
                        <tr key={row.id}>
                          <td>
                            <div>
                              <div
                                className="font-bold"
                                title={row.subjectId || undefined}
                              >
                                {row.displayName}
                              </div>
                              {row.email !== row.displayName && (
                                <div className="text-sm opacity-50">
                                  {row.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{row.role}</td>
                          <td>
                            {row.lastLogin
                              ? formatLocalDateTime(row.lastLogin as string)
                              : ""}
                          </td>
                          <td className="text-right">
                            {row.canBeRemoved && (
                              <button
                                className={classNames(
                                  "btn-table-action-danger",
                                  {
                                    "btn-disabled":
                                      addUserMutate.isLoading ||
                                      removeUserMutate.isLoading,
                                  }
                                )}
                                onClick={async () => {
                                  removeUserMutate.mutate(row.id);
                                }}
                              >
                                remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                />
              )}
          </Box>
        </>
      )}
    </>
  );
};
