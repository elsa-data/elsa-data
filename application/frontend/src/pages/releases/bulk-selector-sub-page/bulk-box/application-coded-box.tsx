import React, { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReleaseApplicationCodedType } from "@umccr/elsa-types";
import { MondoChooser } from "../../../../components/concept-chooser/mondo-chooser";
import { LeftDiv, RightDiv } from "../../../../components/rh/rh-structural";
import { RhSelect } from "../../../../components/rh/rh-select";
import { RhRadioItem, RhRadios } from "../../../../components/rh/rh-radios";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../../queries";
import { ReleaseTypeLocal } from "../../shared-types";
import { RhTextArea } from "../../../../components/rh/rh-text-area";
import { RhCheckItem, RhChecks } from "../../../../components/rh/rh-checks";
import { EagerErrorBoundary } from "../../../../components/errors";

type Props = {
  releaseKey: string;
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
 * @param releaseKey
 * @param applicationCoded
 * @constructor
 */
export const ApplicationCodedBox: React.FC<Props> = ({
  releaseKey,
  applicationCoded,
}) => {
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // whenever we do a mutation of application coded data - our API returns the complete updated
      // state of the *whole* release - and we can use that data to replace the stored react-query state
      onSuccess: (result: ReleaseTypeLocal) => {
        queryClient.setQueryData(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
          result
        );
      },
    }
  );

  const ApplicationTypeRadio = (
    label: string,
    value: "HMB" | "POA" | "DS" | "GRU" | "UN"
  ) => (
    <RhRadioItem
      label={label}
      name="studyType"
      checked={applicationCoded.type === value}
      onChange={(e) =>
        releasePatchMutate.mutate({
          op: "replace",
          path: "/applicationCoded/type",
          value: value,
        })
      }
    />
  );

  const ExampleBeaconQueryLink = (label: string, query: any) => (
    <a
      className="cursor-pointer underline"
      onClick={() => {
        if (textAreaRef.current) {
          textAreaRef.current.value = JSON.stringify(query, null, 2);
        }
        releasePatchMutate.mutate({
          op: "replace",
          path: "/applicationCoded/beacon",
          value: query,
        });
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {releasePatchMutate.isError && (
              <EagerErrorBoundary error={releasePatchMutate.error} />
            )}
            <RhChecks label={"Assertions"}>
              <RhCheckItem
                disabled={true}
                checked={true}
                label={"Applicant Has Documented Ethics Approval"}
              />
              <RhCheckItem
                disabled={true}
                label={"Applicant Has Agreed to Publish the Results"}
              />
              <RhCheckItem
                disabled={true}
                label={"Applicant Asserts the Study is Non-Commercial"}
              />
              <RhCheckItem
                disabled={true}
                label={
                  "Applicant Asserts the Organisations Receiving Data are Not-for-Profit"
                }
              />
              <RhCheckItem
                disabled={true}
                label={"Applicant Asserts the Data Use is for Clinical Care"}
              />
              <RhCheckItem
                disabled={true}
                label={"Applicant Agrees to Return Derived/Enriched Data"}
              />
              <RhCheckItem
                disabled={true}
                label={
                  "Applicant Asserts the Study Involves Method Development (e.g software or algorithms)"
                }
              />
            </RhChecks>
            <div className="grid grid-cols-2 gap-4">
              <RhRadios label={"Study Type"}>
                {ApplicationTypeRadio("Unspecified", "UN")}
                {ApplicationTypeRadio(
                  "Population Origins or Ancestry Research Only",
                  "POA"
                )}
                {ApplicationTypeRadio("General Research Use", "GRU")}
                {ApplicationTypeRadio(
                  "Health or Medical or Biomedical Research",
                  "HMB"
                )}
                {ApplicationTypeRadio("Disease Specific Research", "DS")}
              </RhRadios>
              {applicationCoded.type && applicationCoded.type === "DS" && (
                <MondoChooser
                  className="self-end"
                  label="Disease/Condition(s)"
                  selected={applicationCoded.diseases}
                  addToSelected={(c) =>
                    releasePatchMutate.mutate({
                      op: "add",
                      path: "/applicationCoded/diseases",
                      value: c,
                    })
                  }
                  removeFromSelected={(c) =>
                    releasePatchMutate.mutate({
                      op: "remove",
                      path: "/applicationCoded/diseases",
                      value: c,
                    })
                  }
                  disabled={false}
                />
              )}
            </div>

            {/* this needs to be converted to a proper ontology search/set like "diseases"
              <RhSelect
                label={"Country of Research"}
                options={[
                  { label: "Australia", value: "AUS" },
                  { label: "New Zealand", value: "NZL" },
                  { label: "United States", value: "USA" },
                ]}
              />
              */}

            <div>
              <RhTextArea
                label={"Beacon v2 Query"}
                className="w-full rounded-md border border-gray-300 font-mono"
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
                  releasePatchMutate.mutate({
                    op: "replace",
                    path: "/applicationCoded/beacon",
                    value: JSON.parse(e.target.value),
                  })
                }
              />
              <div className="space-x-2 text-right text-xs text-blue-500">
                <span className="text-black">examples: </span>
                {ExampleBeaconQueryLink("Males", malesQuery)}
                {ExampleBeaconQueryLink("Not Males", notMalesQuery)}
                {ExampleBeaconQueryLink(
                  "Males with Variant 0101101111",
                  malesWithChr1VariantQuery
                )}
                {ExampleBeaconQueryLink(
                  "All with Variant 1111111000",
                  allWithChr2VariantQuery
                )}
                {ExampleBeaconQueryLink(
                  "Females with Variant 1100101111",
                  femalesWithChr20VariantQuery
                )}
              </div>
            </div>
          </div>
        </div>
      </RightDiv>
    </div>
  );
};
