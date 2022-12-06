import React, { useState } from "react";
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

type Props = {
  releaseId: string;
};

/**
 * A form that enables creation of CloudFormation for VPC sharing.
 *
 * @param releaseId
 * @constructor
 */
export const AwsS3VpcShareForm: React.FC<Props> = ({ releaseId }) => {
  const queryClient = useQueryClient();

  const afterMutateForceRefresh = (result: ReleaseTypeLocal) => {
    return queryClient.invalidateQueries(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId)
    );
  };

  const installCloudFormationMutate = useMutation(
    axiosPostArgMutationFn<{ accounts: string[]; vpcId?: string }>(
      `/api/releases/${releaseId}/cfn`
    )
  );

  // TODO this doesn't actually delete yet as there is no delete operation
  const deleteCloudFormationMutate = useMutation(
    axiosPostArgMutationFn<{ accounts: string[]; vpcId?: string }>(
      `/api/releases/${releaseId}/THISISNOTWORKINGYET`
    )
  );

  const cfnQuery = useQuery({
    queryKey: REACT_QUERY_RELEASE_KEYS.cfn(releaseId),
    queryFn: async () => {
      const cfnData = await axios
        .get<any>(`/api/releases/${releaseId}/cfn`)
        .then((response) => response.data);

      return cfnData;
    },
  });

  const tsvColumnCheck = (field: string) => (
    <div key={field} className="flex items-center">
      <input
        defaultChecked={true}
        name={"presignHeader"}
        id={`chx`}
        type="checkbox"
        value={field}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <label className="uppercase ml-3 text-sm text-gray-600">{field}</label>
    </div>
  );

  // for umccr demo purposes - to be removed - a demo VPC in a throwaway account
  const [accountId, setAccountId] = useState("842385035780");
  const [vpcId, setVpcId] = useState("vpc-0ae1fbadcf21859f3");

  return (
    <>
      <div className="grid grid-cols-2 gap-4 divide-x">
        <form>
          <div className="flex flex-col gap-6">
            <label className="block prose">
              The functionality from the perspective of the data holder.
            </label>
            <label className="block prose">
              <span className="text-xs font-bold text-gray-700 uppercase">
                AWS Account(s)
              </span>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
              />
            </label>
            <label className="block prose">
              <span className="text-xs font-bold text-gray-700 uppercase">
                VPC ID
              </span>
              <input
                type="text"
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
              />
            </label>
            {(!cfnQuery.isSuccess || cfnQuery.data === null) && (
              <div className="prose">
                <button
                  type="button"
                  className="btn-normal"
                  onClick={async () => {
                    installCloudFormationMutate.mutate(
                      {
                        accounts: [accountId],
                        vpcId: vpcId,
                      },
                      {
                        onSuccess: afterMutateForceRefresh,
                      }
                    );
                  }}
                >
                  Enable Access Point
                </button>
              </div>
            )}
            {cfnQuery.isSuccess && cfnQuery.data && (
              <div className="prose">
                <button
                  type="button"
                  className="btn-normal"
                  disabled={true}
                  onClick={async () => {
                    deleteCloudFormationMutate.mutate(
                      {
                        accounts: [accountId],
                      },
                      {
                        onSuccess: afterMutateForceRefresh,
                      }
                    );
                  }}
                >
                  Disable Access Point (not working)
                </button>
              </div>
            )}
          </div>
        </form>
        {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS will be converted natively into a browser file save dialog
             when the POST returned a Content-Disposition header */}
        <form action={`/api/releases/${releaseId}/cfn/manifest`} method="POST">
          <div className="flex flex-col gap-6">
            <label className="block prose">
              The functionality from the perspective of a researcher.
            </label>
            {tsvColumnCheck("fileType")}
            {tsvColumnCheck("patientId")}
            {tsvColumnCheck("s3Url")}
            {tsvColumnCheck("md5")}
            <input type="submit" className="btn-normal" value="Download TSV" />
          </div>
        </form>
      </div>
    </>
  );
};
