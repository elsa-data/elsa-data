import React from "react";
import { useEnvRelay } from "../../../providers/env-relay-provider";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import { ReleaseType } from "@umccr/elsa-types";
import { MondoChooser } from "../../../components/concept-chooser/mondo-chooser";
import { doBatchLookup } from "../../../helpers/ontology-helper";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesTable } from "./cases-table";
import { ReleaseTypeLocal } from "./shared-types";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { AwsS3PresignedForm } from "./aws-s3-presigned-form";
import { ApplicationCodedBox } from "./application-coded-box";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const InformationBox: React.FC<Props> = ({ releaseData, releaseId }) => {
  return (
    <Box heading="Release Information">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="font-bold">{releaseData.applicationDacTitle}</span>
        </div>
        <div>
          <ul className="text-right">
            {Array.from(releaseData.datasetMap.entries()).map(
              ([uri, letter], index) => (
                <li key={index}>
                  <span className="mr-6 font-mono">{uri}</span>
                  <span className="rounded-full p-1 text-sm bg-amber-400 text-black">
                    {letter}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </Box>
  );
};
