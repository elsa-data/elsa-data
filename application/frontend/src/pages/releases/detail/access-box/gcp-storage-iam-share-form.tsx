import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { EagerErrorBoundary, ErrorState } from "../../../../components/errors";

type Props = {
  releaseKey: string;
};

type SuccessState = {
  recordsUpdated: number;
};

/**
 * A form that adds IAM permissions to objects in a GCP Storage bucket
 *
 * @param releaseKey
 * @constructor
 */
export const GcpStorageIamShareForm: React.FC<Props> = ({ releaseKey }) => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<
    "ready" | "working" | SuccessState | ErrorState
  >("ready");

  const postAclUpdate = (url: string) => (data: { users: string[] }) => {
    setStatus("working");
    return axios
      .post<any>(url, data)
      .then((reply) => setStatus({ recordsUpdated: reply.data }))
      .catch((error) =>
        setStatus({ error: error?.response?.data ?? error, isSuccess: false }),
      );
  };

  const addAclUsersMutate = useMutation(
    postAclUpdate(`/api/releases/${releaseKey}/gcp-storage/acls/add`),
  );

  const removeAclUsersMutate = useMutation(
    postAclUpdate(`/api/releases/${releaseKey}/gcp-storage/acls/remove`),
  );

  const [iamUsers, setIamUsers] = useState("");

  const iamUsersArray = iamUsers.split(/[ ,]+/).filter((u) => u);

  const isSuccessState = (status: any): status is SuccessState => true;
  const isErrorState = (status: any): status is ErrorState => true;

  return (
    <form>
      {isErrorState(status) && <EagerErrorBoundary error={status.error} />}

      <div className="flex flex-col gap-6">
        <label className="prose block">
          The functionality from the perspective of the data holder.
        </label>
        <label className="prose block">
          <span className="text-xs font-bold uppercase text-gray-700">
            IAM Users
          </span>
          <input
            type="text"
            value={iamUsers}
            onChange={(e) => setIamUsers(e.target.value)}
            className="mt-1 block w-full rounded-md border-transparent bg-gray-50 focus:border-gray-500 focus:bg-white focus:ring-0"
          />
        </label>
        <div className="prose">
          <button
            type="button"
            className="btn-normal"
            onClick={() => addAclUsersMutate.mutate({ users: iamUsersArray })}
          >
            Add IAM Users
          </button>
        </div>
        <div className="prose">
          <button
            type="button"
            className="btn-normal"
            onClick={() =>
              removeAclUsersMutate.mutate({ users: iamUsersArray })
            }
          >
            Remove IAM Users
          </button>
        </div>
      </div>
      {status === "working" && (
        <div className="mt-5 bg-yellow-200 p-5 text-yellow-700 shadow sm:rounded-md">
          Working...
        </div>
      )}
      {isSuccessState(status) && status.recordsUpdated === 0 && (
        <div className="mt-5 bg-yellow-200 p-5 text-yellow-700 shadow sm:rounded-md">
          The operation completed successfully but no objects were updated. Make
          sure to select the cases which you would like to be included in the
          release. Also make sure to enter IAM users who the release should be
          made accessible to.
        </div>
      )}
      {isSuccessState(status) && status?.recordsUpdated > 0 && (
        <div className="mt-5 bg-green-200 p-5 text-green-700 shadow sm:rounded-md">
          Successfully updated ACLs for {status?.recordsUpdated} objects
        </div>
      )}
    </form>
  );
};
