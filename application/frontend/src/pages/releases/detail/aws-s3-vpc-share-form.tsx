import React from "react";
import { useForm } from "react-hook-form";
import { ReleaseRemsSyncRequestType } from "@umccr/elsa-types";
import { useQuery } from "react-query";
import { REACT_QUERY_RELEASE_KEYS, specificReleaseQuery } from "./queries";
import axios from "axios/index";
import { ReleaseTypeLocal } from "./shared-types";

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
  const cfnQuery = useQuery({
    queryKey: REACT_QUERY_RELEASE_KEYS.cfn(releaseId),
    queryFn: async () => {
      const cfnData = await axios
        .get<any>(`/api/releases/${releaseId}/cfn`)
        .then((response) => response.data);

      return cfnData;
    },
  });

  return (
    <>
      <form>
        <div className="flex flex-col gap-6">
          <label className="block prose">
            <span className="text-xs font-bold text-gray-700 uppercase">
              AWS Account
            </span>
            <input
              type="text"
              defaultValue="409003025053"
              name="account"
              className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <label className="block prose">
            <span className="text-xs font-bold text-gray-700 uppercase">
              VPC ID
            </span>
            <input
              type="text"
              defaultValue="vpc-123456788"
              name="vpc"
              className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <div className="prose">
            <button
              type="button"
              className="btn-normal"
              value="Request Endpoint"
              onClick={async () => {
                await axios
                  .post<any>(`/api/releases/${releaseId}/cfn`, {
                    accounts: ["409003025053"],
                  })
                  .then((response) => response.data);
              }}
            />
          </div>
          <div>
            {cfnQuery.isSuccess && (
              <pre>{JSON.stringify(cfnQuery.data, null, 2)}</pre>
            )}
          </div>
        </div>
      </form>
    </>
  );
};
