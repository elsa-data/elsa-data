import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { axiosPostArgMutationFn, REACT_QUERY_RELEASE_KEYS } from "./queries";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const MasterAccessControlBox: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
  };

  const applyAllMutate = useMutation(
    axiosPostArgMutationFn(`/api/releases/${releaseId}/masterAccess`)
  );

  return (
    <Box heading="Master Access Control" headerFromColour="from-orange-300">
      <div className="md:grid md:grid-cols-5 md:gap-6">
        <LeftDiv
          heading={"Access"}
          extra={
            "Activating the access for this release requires the setting of a start and end date. This is the master setting for access - the status of this overrides any other sharing settings in the system."
          }
        />
        <RightDiv>
          <button className="bg-green-400 p-4 rounded">Start</button>
          <button className="bg-red-400 p-4 rounded">Stop All Access</button>
        </RightDiv>
      </div>
    </Box>
  );
};
