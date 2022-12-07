import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { CodingType, ReleaseApplicationCodedType } from "@umccr/elsa-types";
import { MondoChooser } from "../../../../components/concept-chooser/mondo-chooser";
import { LeftDiv, RightDiv } from "../../../../components/rh/rh-structural";
import { RhSelect } from "../../../../components/rh/rh-select";
import { RhRadioItem, RhRadios } from "../../../../components/rh/rh-radios";
import { axiosPostArgMutationFn, REACT_QUERY_RELEASE_KEYS } from "../queries";
import { ReleaseTypeLocal } from "../shared-types";
import { RhTextArea } from "../../../../components/rh/rh-text-area";
import { EagerErrorBoundary } from "../../../../components/errors";

type Props = {
  releaseId: string;
  applicationCoded: ReleaseApplicationCodedType;
};

const malesQuery = {
  filters: [
    {
      scope: "individuals",
      id: "sex",
      operator: "=",
      value: "male",
    },
  ],
};

const notMalesQuery = {
  filters: [
    {
      scope: "individuals",
      id: "sex",
      operator: "!=",
      value: "male",
    },
  ],
};

const malesWithChr1VariantQuery = {
  filters: [
    {
      scope: "individuals",
      id: "sex",
      operator: "=",
      value: "male",
    },
  ],
  // 0101101111
  requestParameters: {
    g_variant: {
      referenceName: "chr1",
      start: 185194,
      referenceBases: "G",
      alternateBases: "C",
    },
  },
};

const allWithChr2VariantQuery = {
  // 1111111000
  requestParameters: {
    g_variant: {
      referenceName: "chr2",
      start: 2397677,
      referenceBases: "GT",
      alternateBases: "G",
    },
  },
};

const femalesWithChr20VariantQuery = {
  // 1100101111
  filters: [
    {
      scope: "individuals",
      id: "sex",
      operator: "=",
      value: "female",
    },
  ],
  // 0101101111
  requestParameters: {
    g_variant: {
      referenceName: "chr20",
      start: 1469919,
      referenceBases: "A",
      alternateBases: "AATAAT",
    },
  },
};

/**
 * The application coded box allows the data admin to clarify/encode details they
 * have found in the application - in preparation of running an algorithm over
 * the datasets.
 *
 * @param releaseId
 * @param applicationCoded
 * @constructor
 */
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
    setLastMutateError(err?.response?.data?.detail || "Error");
  };

  // all of our coded application apis follow the same pattern - post new value to API and get
  // returned the updated release data - this generic mutator handles them all

  const diseaseAddMutate = useMutation(
    axiosPostArgMutationFn<CodingType>(
      `/api/releases/${releaseId}/application-coded/diseases/add`
    )
  );

  const diseaseRemoveMutate = useMutation(
    axiosPostArgMutationFn<CodingType>(
      `/api/releases/${releaseId}/application-coded/diseases/remove`
    )
  );

  const typeSetMutate = useMutation(
    axiosPostArgMutationFn<{ type: string }>(
      `/api/releases/${releaseId}/application-coded/type/set`
    )
  );

  const beaconQueryMutate = useMutation(
    axiosPostArgMutationFn<{ query: any }>(
      `/api/releases/${releaseId}/application-coded/beacon/set`
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

  const ExampleLink = (label: string, query: any) => (
    <a
      className="underline cursor-pointer"
      onClick={() => {
        if (textAreaRef.current) {
          textAreaRef.current.value = JSON.stringify(query, null, 2);
        }
        beaconQueryMutate.mutate(
          { query: query },
          {
            onSuccess: afterMutateUpdateQueryData,
            onError: afterMutateError,
          }
        );
      }}
    >
      {label}
    </a>
  );

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
                <EagerErrorBoundary
                  message={lastMutateError}
                  styling={"bg-red-100"}
                />
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
                      onError: afterMutateError,
                    })
                  }
                  removeFromSelected={(c) =>
                    diseaseRemoveMutate.mutate(c, {
                      onSuccess: afterMutateUpdateQueryData,
                      onError: afterMutateError,
                    })
                  }
                  disabled={false}
                />
              )}

              <div className="col-span-3">
                <RhTextArea
                  label={"Beacon v2 Query"}
                  className="font-mono rounded-md border border-gray-300 w-full"
                  rows={15}
                  defaultValue={JSON.stringify(
                    applicationCoded.beaconQuery,
                    null,
                    2
                  )}
                  ref={textAreaRef}
                  // value={beaconText}
                  // onChange={(e) => setBeaconText(e.target.value)}
                  onBlur={(e) =>
                    beaconQueryMutate.mutate(
                      { query: JSON.parse(e.target.value) },
                      {
                        onSuccess: afterMutateUpdateQueryData,
                        onError: afterMutateError,
                      }
                    )
                  }
                />
                <div className="col-span-3 text-right text-xs space-x-2 text-blue-500">
                  <span className="text-black">examples: </span>
                  {ExampleLink("Males", malesQuery)}
                  {ExampleLink("Not Males", notMalesQuery)}
                  {ExampleLink(
                    "Males with Variant 0101101111",
                    malesWithChr1VariantQuery
                  )}
                  {ExampleLink(
                    "All with Variant 1111111000",
                    allWithChr2VariantQuery
                  )}
                  {ExampleLink(
                    "Females with Variant 1100101111",
                    femalesWithChr20VariantQuery
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RightDiv>
    </div>
  );
};
