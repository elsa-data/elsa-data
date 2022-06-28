import React from "react";
import { useEnvRelay } from "../../../providers/env-relay-provider";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import {
  ApplicationCodedTypeV1,
  DatasetGen3SyncRequestType,
  ReleaseType,
} from "@umccr/elsa-types";
import { MondoChooser } from "../../../components/concept-chooser/mondo-chooser";
import { doBatchLookup } from "../../../helpers/ontology-helper";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesTable } from "./cases-table";
import { ReleaseTypeLocal } from "./shared-types";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { AwsS3PresignedForm } from "./aws-s3-presigned-form";
import { SnomedChooser } from "../../../components/concept-chooser/snomed-chooser";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhFormWithSaveButton } from "../../../components/rh/rh-form-with-save-button";
import { RhTextArea } from "../../../components/rh/rh-text-area";
import { RhInput } from "../../../components/rh/rh-input";
import { RhSelect } from "../../../components/rh/rh-select";
import { RhCheckItem, RhChecks } from "../../../components/rh/rh-checks";
import { RhRadioItem, RhRadios } from "../../../components/rh/rh-radios";
import { SubmitHandler, useForm } from "react-hook-form";

type Props = {
  releaseId: string;
  applicationCoded: ApplicationCodedTypeV1;
};

export const ApplicationCodedBox: React.FC<Props> = ({
  releaseId,
  applicationCoded,
}) => {
  const queryClient = useQueryClient();

  const formMethods = useForm<ApplicationCodedTypeV1>({
    defaultValues: applicationCoded,
  });

  const onSubmit: SubmitHandler<ApplicationCodedTypeV1> = async (data) => {
    console.log(data);
  };

  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">
      <LeftDiv
        heading={"Application Coding"}
        extra={
          "The more application detail are coded, the more the engine can safely bulk select cases by their individual sharing preferences"
        }
      />
      <RightDiv>
        <RhFormWithSaveButton<ApplicationCodedTypeV1>
          onSubmit={onSubmit}
          methods={formMethods}
        >
          {({ register }) => (
            <>
              <RhRadios label={"Study Type"}>
                <RhRadioItem label="DS" name="study" value="DS" />
                <RhRadioItem label="HMB" name="study" value="HMB" />
                <RhRadioItem label="AWS" name="study" value="AWS" />
              </RhRadios>
              <RhTextArea
                label={"Study Start"}
                {...register("studyStart")}
                extra={"Here is some extra text"}
              />
              <RhSelect
                label={"Country of Research"}
                options={[
                  { label: "Australia", value: "AU" },
                  { label: "New Zealand", value: "NZ" },
                  { label: "United States", value: "US" },
                ]}
              />
              <RhChecks label={"Institute(s)"}>
                <RhCheckItem
                  label="WEHI"
                  value="WEHI"
                  {...register("institutesInvolved")}
                />
                <RhCheckItem
                  label="MCRI"
                  value="MCRI"
                  {...register("institutesInvolved")}
                />
                <RhCheckItem
                  label="Hudson"
                  value="Hudson"
                  {...register("institutesInvolved")}
                />
              </RhChecks>

              {applicationCoded.researchType?.code && (
                <MondoChooser
                  label="Disease Specific Study of Condition(s)"
                  selected={(applicationCoded.researchType as any).diseases}
                  addToSelected={(c) => {
                    queryClient.setQueryData<ReleaseType>(
                      ["release", releaseId],
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
                      ["release", releaseId],
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
            </>
          )}
        </RhFormWithSaveButton>
      </RightDiv>
    </div>
  );
};
