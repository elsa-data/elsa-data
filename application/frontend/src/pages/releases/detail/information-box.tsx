import React from "react";
import { useEnvRelay } from "../../../providers/env-relay-provider";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { MondoChooser } from "../../../components/concept-chooser/mondo-chooser";
import { doBatchLookup } from "../../../helpers/ontology-helper";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesTable } from "./cases-table";
import { ReleaseTypeLocal } from "./shared-types";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { AwsS3PresignedForm } from "./aws-s3-presigned-form";
import { ApplicationCodedBox } from "./application-coded-box";
import ReactMarkdown from "react-markdown";
import classNames from "classnames";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export const InformationBox: React.FC<Props> = ({ releaseData, releaseId }) => {
  const colours = [
    "bg-amber-400",
    "bg-red-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-gray-400",
  ];

  return (
    <Box heading="Release Information">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-bold">
            {releaseData.applicationDacTitle}{" "}
            {releaseData.applicationDacIdentifier}
          </span>
          {releaseData.applicationDacDetails && (
            <ReactMarkdown
              components={
                {
                  // Map `h1` (`# heading`) to use `h2`s.
                  //h1: ({node, ...props}) => <h1 className="" {...props} />,
                  // Rewrite `em`s (`*like so*`) to `i` with a red foreground color.
                  //em: ({node, ...props}) => <i style={{color: 'red'}} {...props} />
                }
              }
              className="prose"
              children={releaseData.applicationDacDetails}
            />
          )}
        </div>

        <div>
          <ul className="text-right">
            {Array.from(releaseData.datasetMap.entries()).map(
              ([uri, letter], index) => (
                <li key={index}>
                  <span className="mr-6 font-mono">{uri}</span>
                  <span
                    className={classNames(
                      "rounded-full p-2 text-sm text-black",
                      colours[index]
                    )}
                  >
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
