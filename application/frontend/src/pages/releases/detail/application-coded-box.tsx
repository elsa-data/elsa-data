import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios, { AxiosError } from "axios";
import {
  CodingType,
  ReleaseApplicationCodedType,
  ReleaseType,
} from "@umccr/elsa-types";
import { MondoChooser } from "../../../components/concept-chooser/mondo-chooser";
import { LeftDiv, RightDiv } from "../../../components/rh/rh-structural";
import { RhSelect } from "../../../components/rh/rh-select";
import { RhRadioItem, RhRadios } from "../../../components/rh/rh-radios";
import { makeReleaseTypeLocal, REACT_QUERY_RELEASE_KEYS } from "./queries";
import { ReleaseTypeLocal } from "./shared-types";

type Props = {
  releaseId: string;
  applicationCoded: ReleaseApplicationCodedType;
};

export const ApplicationCodedBox: React.FC<Props> = ({
  releaseId,
  applicationCoded,
}) => {
  const queryClient = useQueryClient();

  const [lastMutateError, setLastMutateError] = useState<string | null>(null);

  // whenever we do a mutation of application coded data - our API returns the complete updated
  // state of the whole release
  // we set this as the success function to take advantage of that
  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
    setLastMutateError(null);
  };

  const afterMutateError = (err: any) => {
    setLastMutateError(err?.response?.data?.detail);
  };

  // all of our coded application apis follow the same pattern - post new value to API and get
  // returned the updated release data - this generic mutator handles them all
  const genericMutationFn =
    <T,>(apiUrl: string) =>
    (c: T) =>
      axios
        .post<ReleaseType>(apiUrl, c)
        .then((response) => makeReleaseTypeLocal(response.data));

  const diseaseAddMutate = useMutation(
    genericMutationFn<CodingType>(
      `/api/releases/${releaseId}/application-coded/diseases/add`
    )
  );

  const diseaseRemoveMutate = useMutation(
    genericMutationFn<CodingType>(
      `/api/releases/${releaseId}/application-coded/diseases/remove`
    )
  );

  const typeSetMutate = useMutation(
    genericMutationFn<{ type: string }>(
      `/api/releases/${releaseId}/application-coded/type/set`
    )
  );

  const typeRadio = (label: string, value: string) => (
    <RhRadioItem
      label={label}
      name="study"
      checked={applicationCoded.type === value}
      onChange={(e) =>
        typeSetMutate.mutate(
          { type: value },
          {
            onSuccess: afterMutateUpdateQueryData,
            onError: afterMutateError,
          }
        )
      }
    />
  );

  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">
      <LeftDiv
        heading={"Application Coding"}
        extra={
          "The more application detail are coded, the more the engine can safely bulk select cases by their individual sharing preferences"
        }
      />
      <RightDiv>
        <div className="shadow sm:rounded-md">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <div className="grid grid-cols-3 gap-6">
              {lastMutateError && (
                <p className="col-span-3 font-bold text-red-700 border-gray-800 border-2 p-2">
                  {lastMutateError}
                </p>
              )}
              <RhRadios label={"Study Type"}>
                {typeRadio("Disease Specific", "DS")}
                {typeRadio("Health/Medical/Bio", "HMB")}
                {typeRadio("POA", "POA")}
                {typeRadio("AWS", "AWS")}
              </RhRadios>
              <RhSelect
                label={"Country of Research"}
                options={[
                  { label: "Australia", value: "AUS" },
                  { label: "New Zealand", value: "NZL" },
                  { label: "United States", value: "USA" },
                ]}
              />

              {applicationCoded.type && applicationCoded.type === "DS" && (
                <MondoChooser
                  label="Research of Disease/Condition(s)"
                  selected={applicationCoded.diseases}
                  addToSelected={(c) =>
                    diseaseAddMutate.mutate(c, {
                      onSuccess: afterMutateUpdateQueryData,
                    })
                  }
                  removeFromSelected={(c) =>
                    diseaseRemoveMutate.mutate(c, {
                      onSuccess: afterMutateUpdateQueryData,
                    })
                  }
                  disabled={false}
                />
              )}
            </div>
          </div>
        </div>
      </RightDiv>
    </div>
  );
};
