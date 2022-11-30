import React from "react";
import { useForm } from "react-hook-form";
import { ReleaseRemsSyncRequestType } from "@umccr/elsa-types";
import { useQuery } from "react-query";
import { REACT_QUERY_RELEASE_KEYS, specificReleaseQuery } from "./queries";
import axios from "axios";
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
                defaultValue="409003025053"
                name="accounts"
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
                value="Enable Endpoint"
                onClick={async () => {
                  await axios
                    .post<any>(`/api/releases/${releaseId}/cfn`, {
                      accounts: ["409003025053"],
                    })
                    .then((response) => response.data);
                }}
              >
                Enable Access Point
              </button>
            </div>
            <div>
              {cfnQuery.isSuccess && (
                <pre className="text-xs">
                  {JSON.stringify(cfnQuery.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </form>
        {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
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
