import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { ReleaseRemsSyncRequestType } from "@umccr/elsa-types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  axiosPostArgMutationFn,
  axiosPostNullMutationFn,
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseQuery,
} from "./queries";
import axios from "axios";
import { ReleaseTypeLocal } from "./shared-types";
import { isUndefined } from "lodash";
import { EagerErrorBoundary, ErrorState } from "../../../components/errors";

type Props = {
  releaseId: string;
};

type SuccessState = {
  recordsUpdated: number;
};

/**
 * A form that adds IAM permissions to objects in a GCP Storage bucket
 *
 * @param releaseId
 * @constructor
 */
export const GcpStorageIamShareForm: React.FC<Props> = ({ releaseId }) => {
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
        setStatus({ error: error?.response?.data ?? error, isSuccess: false })
      );
  };

  const addAclUsersMutate = useMutation(
    postAclUpdate(`/api/releases/${releaseId}/gcp-storage/acls/add`)
  );

  const removeAclUsersMutate = useMutation(
    postAclUpdate(`/api/releases/${releaseId}/gcp-storage/acls/remove`)
  );

  const tsvColumnCheck = (field: string) => (
    <div key={field} className="flex items-center gap-2">
      <input
        className="checkbox"
        defaultChecked={true}
        name="presignHeader"
        id={`chx-${field}`}
        value={field}
      />
      <label className="uppercase" htmlFor={`chx-${field}`}>
        {field}
      </label>
    </div>
  );

  const [iamUsers, setIamUsers] = useState("");

  const iamUsersArray = iamUsers.split(/[ ,]+/).filter((u) => u);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 divide-x">
        <form>
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
                onClick={() =>
                  addAclUsersMutate.mutate({ users: iamUsersArray })
                }
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
          {status?.isSuccess === false && (
            <EagerErrorBoundary
              message="Something went wrong fetching release data."
              error={status.error}
              styling="mt-5 shadow sm:rounded-md bg-red-100"
            />
          )}
          {status === "working" && (
            <div className="mt-5 bg-yellow-200 p-5 text-yellow-700 shadow sm:rounded-md">
              Working...
            </div>
          )}
          {status?.recordsUpdated !== undefined &&
            status?.recordsUpdated === 0 && (
              <div className="mt-5 bg-yellow-200 p-5 text-yellow-700 shadow sm:rounded-md">
                The operation completed successfully but no objects were
                updated. Make sure to select the cases which you would like to
                be included in the release. Also make sure to enter IAM users
                who the release should be made accessible to.
              </div>
            )}
          {status?.recordsUpdated !== undefined &&
            status?.recordsUpdated > 0 && (
              <div className="mt-5 bg-green-200 p-5 text-green-700 shadow sm:rounded-md">
                Successfully updated ACLs for {status?.recordsUpdated} objects
              </div>
            )}
        </form>
        {/* TODO: Implement me */}
        {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS will be converted natively into a browser file save dialog
             when the POST returned a Content-Disposition header */}
        <form
          action={`/api/releases/${releaseId}/gcp-storage/manifest`}
          method="POST"
          className="flex flex-col gap-4 p-6"
        >
          <label className="prose block">
            The functionality from the perspective of a researcher.
          </label>
          {tsvColumnCheck("fileType")}
          {tsvColumnCheck("patientId")}
          {tsvColumnCheck("gsUrl")}
          {tsvColumnCheck("md5")}
          <input type="submit" className="btn-normal" value="Download TSV" />
        </form>
      </div>
    </>
  );
};
