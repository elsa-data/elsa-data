import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LeftDiv, RightDiv } from "../../../../components/rh/rh-structural";
import { RhRadioItem, RhRadios } from "../../../../components/rh/rh-radios";
import {
  axiosPostArgMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../../queries";
import { ReleaseTypeLocal } from "../../shared-types";
import { RhInput } from "../../../../components/rh/rh-input";
import { EagerErrorBoundary } from "../../../../components/errors";

type Props = {
  releaseKey: string;
};

/**
 * The consent source box provides a place for setting sources of consent information
 * and any default consent rules.
 *
 * @param releaseKey
 * @constructor
 */
export const ConsentSourcesBox: React.FC<Props> = ({ releaseKey }) => {
  const queryClient = useQueryClient();

  const [lastMutateError, setLastMutateError] = useState<string | null>(null);

  // whenever we do a mutation of application coded data - our API returns the complete updated
  // state of the whole release
  // we set this as the success function to take advantage of that
  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
      result,
    );
    setLastMutateError(null);
  };

  const afterMutateError = (err: any) => {
    console.log(err?.response);
    setLastMutateError(err?.response?.data?.detail);
  };

  const consentPreferenceMutate = useMutation(
    axiosPostArgMutationFn<{ type: string }>(
      `/api/releases/${releaseKey}/NEEDTODOTHIS`,
    ),
  );

  const ctrlUrlMutate = useMutation(
    axiosPostArgMutationFn<{ type: string }>(
      `/api/releases/${releaseKey}/NEEDTODOTHIS`,
    ),
  );

  const typeRadio = (label: string, value: string) => (
    <RhRadioItem
      label={label}
      name="consentPreference"
      checked={true} // fix
      onChange={(e) =>
        consentPreferenceMutate.mutate(
          { type: value },
          {
            onSuccess: afterMutateUpdateQueryData,
            onError: afterMutateError,
          },
        )
      }
    />
  );

  const typecRadio = (label: string, value: string) => (
    <RhRadioItem
      label={label}
      name="consentOrder"
      checked={true} // fix
      onChange={(e) =>
        consentPreferenceMutate.mutate(
          { type: value },
          {
            onSuccess: afterMutateUpdateQueryData,
            onError: afterMutateError,
          },
        )
      }
    />
  );

  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">
      <LeftDiv
        heading={"Consent Sources"}
        extra={
          "Datasets may include their own per case/individual/biosample consent preferences. Consent information can also be sourced from external data sources and merged with existing information"
        }
      />
      <RightDiv>
        <div className="shadow sm:rounded-md">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            <div className="grid grid-cols-3 gap-6">
              {lastMutateError && (
                <EagerErrorBoundary error={new Error(lastMutateError)} />
              )}
              <RhRadios label={"Consent Defaults"}>
                {typeRadio("Absent consent information = Consent", "YES")}
                {typeRadio("Absent consent information = No Consent", "NO")}
              </RhRadios>
              <RhRadios label={"Consent Order"}>
                {typecRadio("Use Remote Consent Source First", "YES")}
                {typecRadio("Use Local Consent Source First", "NO")}
              </RhRadios>
              <RhInput
                label={"URL of CTRL Consent Source"}
                value={"https://ctrl.australiangenomics.org.au"}
                onChange={(e) =>
                  ctrlUrlMutate.mutate(
                    { type: e.target.value },
                    {
                      onSuccess: afterMutateUpdateQueryData,
                      onError: afterMutateError,
                    },
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
