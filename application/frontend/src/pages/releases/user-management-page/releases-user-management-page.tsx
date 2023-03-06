import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseParticipantsQuery,
} from "../detail/queries";
import { EagerErrorBoundary, ErrorState } from "../../../components/errors";
import { Box } from "../../../components/boxes";
import { ReleaseParticipantType } from "@umccr/elsa-types";
import { IsLoadingDiv } from "../../../components/is-loading-div";
import classNames from "classnames";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import axios from "axios";
import { useReleasesMasterData } from "../releases-types";

/**
 * A page allowing the display/editing of users participating in a release.
 */
export const ReleasesUserManagementPage: React.FC = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const releaseParticipantsQuery = useQuery<ReleaseParticipantType[]>({
    queryKey: REACT_QUERY_RELEASE_KEYS.participant(releaseId),
    queryFn: specificReleaseParticipantsQuery,
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
  });

  const queryClient = useQueryClient();

  const afterMutateForceRefresh = () => {
    return queryClient.invalidateQueries(
      REACT_QUERY_RELEASE_KEYS.participant(releaseId)
    );
  };

  const addUserMutate = useMutation(
    (c: { newUserEmail: string; newUserRole: "PI" | "Member" }) =>
      axios.post<void>(`/api/releases/${releaseId}/participants`, {
        email: c.newUserEmail,
        role: c.newUserRole,
      }),
    { onSuccess: afterMutateForceRefresh }
  );

  const removeUserMutate = useMutation(
    (participantId: string) =>
      axios.delete<void>(
        `/api/releases/${releaseId}/participants/${participantId}`
      ),
    { onSuccess: afterMutateForceRefresh }
  );

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRoleIsPi, setNewUserRoleIsPi] = useState(false);

  const isAddButtonDisabled =
    addUserMutate.isLoading ||
    removeUserMutate.isLoading ||
    newUserEmail.trim().length == 0;

  return (
    <>
      <Box heading="Add/Update User In This Release">
        <form className="prose-xs prose max-w-xs">
          <div className="form-control">
            <label className="label">
              <span className="label-text">User Email</span>
            </label>
            <input
              type="text"
              placeholder="email@address"
              className="input-bordered input w-full"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Member</span>
              <input
                type="radio"
                name="roleRadio"
                className="radio"
                checked={!newUserRoleIsPi}
                onChange={(e) => setNewUserRoleIsPi(!newUserRoleIsPi)}
              />
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">PI</span>
              <input
                type="radio"
                name="roleRadio"
                className="radio"
                checked={newUserRoleIsPi}
                onChange={(e) => setNewUserRoleIsPi(!newUserRoleIsPi)}
              />
            </label>
          </div>
          <div className="form-control">
            <button
              type="button"
              disabled={isAddButtonDisabled}
              className={classNames("btn", {
                "btn-disabled": isAddButtonDisabled,
              })}
              onClick={async () => {
                addUserMutate.mutate({
                  newUserEmail: newUserEmail,
                  newUserRole: newUserRoleIsPi ? "PI" : "Member",
                });
              }}
            >
              Add
            </button>
          </div>
        </form>
      </Box>

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
                <table className="table-compact table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Last Login</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {releaseParticipantsQuery.data.map((row, rowIndex) => {
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
                    })}
                  </tbody>
                </table>
              )}
          </Box>
        </>
      )}
      {!error.isSuccess && (
        <EagerErrorBoundary
          message={"Something went wrong fetching release participant data."}
          error={error.error}
          styling={"bg-error-content"}
        />
      )}
    </>
  );
};
