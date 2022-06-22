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

export const AwsS3PresignedForm: React.FC<Props> = ({ releaseId }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReleaseRemsSyncRequestType>();

  const onSubmit: SubmitHandler<ReleaseRemsSyncRequestType> = async (data) => {
    const response = await axios.post<ReleaseAwsS3PresignRequestType>(
      `/api/releases/${releaseId}/pre-signed`,
      data
    );

    console.log(response.data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
  );
};
