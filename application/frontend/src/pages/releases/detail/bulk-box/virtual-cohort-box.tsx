import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { CodingType, ReleaseApplicationCodedType } from "@umccr/elsa-types";
import { MondoChooser } from "../../../../components/concept-chooser/mondo-chooser";
import { LeftDiv, RightDiv } from "../../../../components/rh/rh-structural";
import { RhSelect } from "../../../../components/rh/rh-select";
import { RhRadioItem, RhRadios } from "../../../../components/rh/rh-radios";
import { axiosPostArgMutationFn, REACT_QUERY_RELEASE_KEYS } from "../queries";
import { ReleaseTypeLocal } from "../shared-types";
import { RhInput } from "../../../../components/rh/rh-input";
import { RhTextArea } from "../../../../components/rh/rh-text-area";

type Props = {
  releaseId: string;
};

/**
 * The virtual cohort box allows the specification of queries / sample ids that can be used for
 * building a virtual cohort (assuming consent has been matched).
 *
 * @param releaseId
 * @constructor
 */
export const VirtualCohortBox: React.FC<Props> = ({ releaseId }) => {
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

  const ctrlUrlMutate = useMutation(
    axiosPostArgMutationFn<{ type: string }>(
      `/api/releases/${releaseId}/NEEDTODOTHIS`
    )
  );

  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">
      <LeftDiv
        heading={"Virtual Cohort"}
        extra={
          "A virtual cohort may be layered over the base consent information - allowing the release to be limited to 'males under 25' for example"
        }
      />
      <RightDiv>
        <div className="shadow sm:rounded-md">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <div className="grid-cols-5 flex flex-col">
              {lastMutateError && (
                <p className="col-span-3 font-bold text-red-700 border-gray-800 border-2 p-2">
                  {lastMutateError}
                </p>
              )}
              <RhTextArea
                label={"Beacon v2 Query"}
                className="font-mono border-none w-full"
                rows={15}
                value={
                  "{\n" +
                  '  "filters": [\n' +
                  "    {\n" +
                  '      "id": "age",\n' +
                  '      "operator": ">="\n' +
                  '      "scope": "individuals"\n' +
                  '      "value": "P70Y"\n' +
                  "    }\n" +
                  "  ],\n" +
                  '  "requestParameters": {\n' +
                  '    "referenceName": "NC_000017.11",\n' +
                  '    "start": [ 5000000, 7676592 ],\n' +
                  '    "end": [ 7669607, 10000000 ],\n' +
                  '    "variantType": "DEL"\n' +
                  "  }\n" +
                  "}"
                }
                onChange={(e) =>
                  ctrlUrlMutate.mutate(
                    { type: e.target.value },
                    {
                      onSuccess: afterMutateUpdateQueryData,
                      onError: afterMutateError,
                    }
                  )
                }
              />
            </div>
          </div>
        </div>
      </RightDiv>
    </div>
  );
};
