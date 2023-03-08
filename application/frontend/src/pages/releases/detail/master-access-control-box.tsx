import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "../shared-types";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { axiosPostArgMutationFn, REACT_QUERY_RELEASE_KEYS } from "../queries";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const MasterAccessControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
      result
    );
  };

  const applyAllMutate = useMutation(
    axiosPostArgMutationFn(`/api/releases/${releaseKey}/masterAccess`)
  );

  return (
    <Box heading="Master Access Control">
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Access"}
          extra={
            "Activating the access for this release requires the setting of a start and end date. This is the master setting for access - the status of this overrides any other sharing settings in the system."
          }
        />
        <RightDiv>
          <div className="flex flex-row gap-2">
            {releaseData.activation && (
              <button className="btn-danger">Stop All Access</button>
            )}
            {!releaseData.activation && (
              <button className="btn-normal">Start</button>
            )}
          </div>
        </RightDiv>
      </div>
    </Box>
  );
};
