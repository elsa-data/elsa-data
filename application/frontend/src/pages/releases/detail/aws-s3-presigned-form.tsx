import React from "react";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ReleaseAwsS3PresignRequestType,
  ReleaseRemsSyncRequestType,
} from "@umccr/elsa-types";
import axios from "axios";

type Props = {
  releaseId: string;
};

/**
 * A form that is used to submit a job to the backend - asking for AWS S3
 * presigned URLS.
 *
 * @param releaseId
 * @constructor
 */
export const AwsS3PresignedForm: React.FC<Props> = ({ releaseId }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReleaseRemsSyncRequestType>();

  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form action={`/api/releases/${releaseId}/pre-signed`} method="POST">
        <div className="flex flex-col gap-6">
          <label className="block">
            <span className="text-xs font-bold text-gray-700 uppercase">
              Something
            </span>
            <input
              type="text"
              defaultValue="https://hgpp-rems.dev.umccr.org"
              {...register("remsUrl", { required: false })}
              className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <input type="submit" className="btn-blue w-60" />
        </div>
      </form>
    </>
  );
};
