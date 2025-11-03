import React, { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LeftDiv, RightDiv } from "../../../../components/rh/rh-structural";
import { RhRadios } from "../../../../components/rh/rh-radios";
import { axiosPatchOperationMutationFn } from "../../queries";
import { ReleaseTypeLocal } from "../../shared-types";
import { RhCheckItem, RhChecks } from "../../../../components/rh/rh-checks";
import { EagerErrorBoundary } from "../../../../components/errors";
import { SnomedChooser } from "../../../../components/concept-chooser/snomed-chooser";

type Props = {
  releaseKey: string;
  applicationCoded: {
    type: "HMB" | "DS" | "CC" | "GRU" | "POA";
    diseases: {
      display?: string | undefined;
      code: string;
      system: string;
    }[];
    countriesInvolved: {
      display?: string | undefined;
      code: string;
      system: string;
    }[];
    beaconQuery: any;
  };
};

/*const malesQuery = {
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
}; */

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
  const releasePatchMutate = useMutation({
    mutationFn: axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    onSuccess: async (_result: ReleaseTypeLocal) => {
      await queryClient.invalidateQueries();
      // TODO whenever we do a mutation of application coded data - our API returns the complete updated
      //      state of the *whole* release - and we can use that data to replace the stored react-query state
    },
  });

  /*const CountryTypeCheck = (label: string, value: string) => (
    <label className="label">
      <input
        type="checkbox"
        className="checkbox"
        checked={(applicationCoded.countriesInvolved ?? []).some(
          (t) => t.code === value,
        )}
        onChange={(e) => {
          if (e.target.checked) {
            releasePatchMutate.mutate({
              op: "add",
              path: "/applicationCoded/countries",
              value: {
                system: "",
                code: value,
              },
            });
          } else {
            releasePatchMutate.mutate({
              op: "remove",
              path: "/applicationCoded/countries",
              value: {
                system: "",
                code: value,
              },
            });
          }
        }}
      />
      {label}
    </label>
  ); */

  {
    /*<RhCheckItem
    label={label}

    /> */
  }

  const ApplicationTypeRadio = (
    label: string,
    value: "HMB" | "POA" | "DS" | "GRU" | "UN",
  ) => {
    const id = useId();

    return (
      <>
        <label className="label" htmlFor={id}>
          <input
            type="radio"
            className="radio"
            id={id}
            name="studyType"
            checked={applicationCoded.type === value}
            onChange={() =>
              releasePatchMutate.mutate({
                op: "replace",
                path: "/applicationCoded/type",
                value: value,
              })
            }
          />
          {label}
        </label>
      </>
    );
  };

  const IsCheck = (label: string, path: any) => (
    <RhCheckItem
      disabled={false}
      label={label}
      onChange={(e) => {
        releasePatchMutate.mutate({
          op: "replace",
          path: path,
          value: e.target.checked,
        });
      }}
    />
  );

  /*(

  <RhRadioItem
    label={label}
    name="studyType"
    }
  />
);*/

  /*const ExampleBeaconQueryLink = (label: string, query: any) => (
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

  const textAreaRef = useRef<HTMLTextAreaElement>(null); */

  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">
      <LeftDiv
        heading={"Application Coding"}
        extra={
          "The more application detail are coded, the more accurately the engine can build cohorts"
        }
      />
      <RightDiv>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {releasePatchMutate.isError && (
              <EagerErrorBoundary error={releasePatchMutate.error} />
            )}

            <RhRadios label={"Nature of Study"}>
              {ApplicationTypeRadio(
                "Health or Medical or Biomedical Research (DS, HMB)",
                "HMB",
              )}
              <SnomedChooser
                className="ml-8 mb-2"
                label="Diseases in Study"
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
                disabled={applicationCoded.type !== "HMB"}
              />
              {ApplicationTypeRadio("Other (POA, GRU)", "GRU")}
            </RhRadios>

            <RhChecks label={"Assertions"}>
              {IsCheck(
                "Applicant Asserts the Study is Non-Commercial",
                "/applicationCoded/isNotCommercial",
              )}
              {/*<RhCheckItem
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
              /> */}
            </RhChecks>

            {/* <div className="grid grid-cols-2 gap-4">
              <RhRadios label={"Study Type"}>
                {ApplicationTypeRadio(
                  "Population Origins or Ancestry Research Only",
                  "POA",
                )}
                {ApplicationTypeRadio("General Research Use", "GRU")}
                {ApplicationTypeRadio(
                  "Health or Medical or Biomedical Research",
                  "HMB",
                )}
                {ApplicationTypeRadio("Disease Specific Research", "DS")}
              </RhRadios>
            </div> */}

            {/*<RhChecks label={"Superpopulation"}>
              {CountryTypeCheck("European", "EUR")}
              {CountryTypeCheck("East Asian", "EAS")}
              {CountryTypeCheck("South Asian", "SAS")}
              {CountryTypeCheck("African", "AFR")}
              {CountryTypeCheck("American", "AMR")}
            </RhChecks>

            <div>
              <RhTextArea
                label={"Beacon v2 Query"}
                className="w-full rounded-md border border-gray-300 font-mono"
                rows={15}
                defaultValue={JSON.stringify(
                  applicationCoded.beaconQuery,
                  null,
                  2,
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
                  malesWithChr1VariantQuery,
                )}
                {ExampleBeaconQueryLink(
                  "All with Variant 1111111000",
                  allWithChr2VariantQuery,
                )}
                {ExampleBeaconQueryLink(
                  "Females with Variant 1100101111",
                  femalesWithChr20VariantQuery,
                )}
              </div>
            </div> */}
          </div>
        </div>
      </RightDiv>
    </div>
  );
};
