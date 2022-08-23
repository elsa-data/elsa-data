import React from "react";
import { useForm } from "react-hook-form";
import { ReleaseRemsSyncRequestType } from "@umccr/elsa-types";

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
  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form action={`/api/releases/${releaseId}/cfn`} method="POST">
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
            <input
              type="submit"
              className="btn-normal"
              value="Request Endpoint"
            />
          </div>
        </div>
      </form>
    </>
  );
};
