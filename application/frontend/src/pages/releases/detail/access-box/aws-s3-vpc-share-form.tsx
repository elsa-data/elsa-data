import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_RELEASE_KEYS } from "../../queries";
import axios from "axios";
import { trpc } from "../../../../helpers/trpc";

type Props = {
  releaseKey: string;
};

/**
 * A form that enables creation of CloudFormation for VPC sharing.
 *
 * @param releaseKey
 * @constructor
 */
export const AwsS3VpcShareForm: React.FC<Props> = ({ releaseKey }) => {
  const queryClient = useQueryClient();

  const installCloudFormationMutate =
    trpc.releaseJob.startAccessPointInstall.useMutation({
      onSettled: async () =>
        queryClient.invalidateQueries(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey)
        ),
    });
  const deleteCloudFormationMutate =
    trpc.releaseJob.startAccessPointUninstall.useMutation({
      onSettled: async () =>
        queryClient.invalidateQueries(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey)
        ),
    });

  // TODO: convert this over to TRPC
  const cfnQuery = useQuery({
    queryKey: REACT_QUERY_RELEASE_KEYS.cfn(releaseKey),
    queryFn: async () => {
      const cfnData = await axios
        .get<any>(`/api/releases/${releaseKey}/cfn`)
        .then((response) => response.data);

      return cfnData;
    },
  });

  return (
    <form>
      <div className="flex flex-col gap-6">
        <label className="prose block">
          The functionality from the perspective of the data holder.
        </label>
        <label className="prose block">
          <span className="text-xs font-bold uppercase text-gray-700">
            AWS Account(s)
          </span>
        </label>
        <label className="prose block">
          <span className="text-xs font-bold uppercase text-gray-700">
            VPC ID
          </span>
        </label>
        {(!cfnQuery.isSuccess || cfnQuery.data === null) && (
          <div className="prose">
            <button
              type="button"
              className="btn-normal"
              onClick={() => {
                installCloudFormationMutate.mutate({
                  releaseKey: releaseKey,
                  accounts: [""],
                  vpcId: "",
                });
              }}
              disabled={
                installCloudFormationMutate.isLoading ||
                deleteCloudFormationMutate.isLoading
              }
            >
              Install Access Point
            </button>
          </div>
        )}
        {cfnQuery.isSuccess && cfnQuery.data && (
          <div className="prose">
            <button
              type="button"
              className="btn-normal"
              disabled={
                installCloudFormationMutate.isLoading ||
                deleteCloudFormationMutate.isLoading
              }
              onClick={async () => {
                deleteCloudFormationMutate.mutate({
                  releaseKey: releaseKey,
                });
              }}
            >
              Delete Access Point
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
