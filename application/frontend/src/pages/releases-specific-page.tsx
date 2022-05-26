import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { LayoutAuthPage } from "../layouts/layout-auth-page";
import { Box } from "../helpers/boxes";
import { ReleaseType } from "@umccr/elsa-types";

type ReleaseSpecificPageParams = {
  releaseId: string;
};

export const ReleasesSpecificPage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const { releaseId: releaseIdParam } = useParams<ReleaseSpecificPageParams>();

  const { data: releaseData } = useQuery(
    ["release", releaseIdParam],
    async ({ queryKey }) => {
      const rid = queryKey[1];

      return await axios
        .get<ReleaseType>(`/api/releases/${rid}`)
        .then((response) => response.data);
    },
    {}
  );

  return (
    <LayoutAuthPage>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        <Box heading="Stuff">
          <p>{releaseData && <span>{releaseData.id}</span>}</p>
        </Box>
      </div>
    </LayoutAuthPage>
  );
};
