import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../components/boxes";
import { ReleaseType } from "@umccr/elsa-types";
import { MondoChooser } from "../components/concept-chooser/mondo-chooser";
import { doBatchLookup } from "../helpers/ontology-helper";
import { LayoutBase } from "../layouts/layout-base";
import { ReleasesCasesTable } from "./releases-cases-table";
import { ReleaseTypeLocal } from "./releases-local-types";
import { VerticalTabs } from "../components/vertical-tabs";
import { AwsS3PresignedForm } from "./releases/specific/aws-s3-presigned";

type ReleaseSpecificPageParams = {
  releaseId: string;
};

export const ReleasesSpecificPage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const { releaseId: releaseIdParam } = useParams<ReleaseSpecificPageParams>();

  const queryClient = useQueryClient();

  const { data: releaseData, isLoading: releaseIsLoading } = useQuery({
    queryKey: ["release", releaseIdParam],
    queryFn: async ({ queryKey }) => {
      const rid = queryKey[1];

      const releaseData = await axios
        .get<ReleaseTypeLocal>(`/api/releases/${rid}`)
        .then((response) => response.data);

      if (releaseData.applicationCoded.researchType.code === "DS") {
        await doBatchLookup(
          "https://onto.prod.umccr.org/fhir",
          releaseData.applicationCoded.researchType.diseases
        );
      }

      // we want to make an immutable map of letters (e.g. uri => A,B...)
      // just for some UI optimisations which is why this is strictly local
      releaseData.datasetMap = new Map(
        releaseData.datasetUris
          .sort()
          .map((duri, index) => [
            duri,
            String.fromCharCode(index + "A".charCodeAt(0)),
          ])
      );

      return releaseData;
    },
  });

  if (!releaseIdParam) return <p>No release id</p>;

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {releaseData && (
          <>
            <Box heading="Release Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold">
                    {releaseData.applicationDacTitle}
                  </span>
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

            <Box heading="Cases">
              <div className="shadow-md rounded-lg">
                <ReleasesCasesTable
                  releaseId={releaseIdParam}
                  datasetMap={releaseData.datasetMap}
                  isEditable={releaseData.permissionEditSelections || false}
                />
              </div>
            </Box>

            {releaseData.permissionAccessData && (
              <Box heading="Access Data">
                <VerticalTabs tabs={["AWS S3 PreSigned", "htsget"]}>
                  <AwsS3PresignedForm releaseId={releaseIdParam} />
                  <form>
                    <input type="submit" className="btn-blue w-60" />
                  </form>
                </VerticalTabs>
              </Box>
            )}

            {releaseData.permissionEditApplicationCoded && (
              <Box heading="Application Coded (Admin)">
                <p>
                  The details of the application can be coded here to help with
                  release automation.
                </p>
                {releaseData?.applicationCoded?.researchType?.code && (
                  <MondoChooser
                    selected={
                      (releaseData.applicationCoded.researchType as any)
                        .diseases
                    }
                    addToSelected={(c) => {
                      queryClient.setQueryData<ReleaseType>(
                        ["release", releaseIdParam],
                        (x) => {
                          if (x) {
                            if (x.applicationCoded.researchType.code === "DS") {
                              x.applicationCoded.researchType.diseases = [
                                ...x.applicationCoded.researchType.diseases,
                                c,
                              ];
                            }
                          }
                          return x!;
                        }
                      );
                    }}
                    removeFromSelected={(system, code) => {
                      queryClient.setQueryData<ReleaseType>(
                        ["release", releaseIdParam],
                        (x) => {
                          if (x) {
                            if (x.applicationCoded.researchType.code === "DS") {
                              x.applicationCoded.researchType.diseases =
                                x.applicationCoded.researchType.diseases.filter(
                                  (item) =>
                                    item.code !== code || item.system !== system
                                );
                            }
                          }
                          return x!;
                        }
                      );
                    }}
                    disabled={false}
                  />
                )}
              </Box>
            )}
          </>
        )}
      </div>
    </LayoutBase>
  );
};
