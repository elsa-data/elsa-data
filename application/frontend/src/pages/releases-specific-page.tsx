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
        .get<ReleaseType>(`/api/releases/${rid}`)
        .then((response) => response.data);

      if (releaseData.applicationCoded.researchType.code === "DS") {
        await doBatchLookup(
          "https://onto.prod.umccr.org/fhir",
          releaseData.applicationCoded.researchType.diseases
        );
      }

      return releaseData;
    },
  });

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {releaseData && (
          <>
            <Box heading="Stuff">
              <p>
                <span>{releaseData.id}</span>
              </p>
            </Box>

            <Box heading="Application Coded">
              <p>
                The details of the application can be coded here to help with
                release automation.
              </p>
              {releaseData?.applicationCoded?.researchType?.code && (
                <MondoChooser
                  selected={
                    (releaseData.applicationCoded.researchType as any).diseases
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
          </>
        )}
      </div>
    </LayoutBase>
  );
};
