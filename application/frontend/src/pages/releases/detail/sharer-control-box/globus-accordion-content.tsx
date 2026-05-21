import React, { PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import type { ReleasePatchOperationType } from "../../../../../../backend/src/shared/schemas-release-operations";
import { SharerGlobusType } from "../../../../../../backend/src/config/config-schema-sharer";
import { useTRPC } from "../../../../helpers/trpc-modern";

type GlobusAccordionContentProps = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  releasePatchMutator: UseMutationResult<
    ReleaseTypeLocal,
    any,
    ReleasePatchOperationType,
    any
  >;
  globusSetting: SharerGlobusType;
  globusWorking: boolean;
};

export const GlobusAccordionContent: React.FC<
  PropsWithChildren<GlobusAccordionContentProps>
> = (props) => {
  const trpc = useTRPC();
  const [searchParams] = useSearchParams();
  const justAuthorised = searchParams.get("globusAuthorised") === "true";
  const globusAuthError = searchParams.get("globusError") === "true";

  const globusVerifyUsernameTriggerMutate = useMutation(
    trpc.releaseJob.verifyGlobusUsername.mutationOptions({}),
  );

  return (
    <>
      <div className="form-control flex-grow lg:w-3/4">
        <label className="label">
          <span className="label-text">
            Researcher Globus username{" "}
            <span className="text-xs">
              (NOTE this field can be edited by the researchers as well)
            </span>
          </span>
        </label>
        <input
          type="text"
          className="input-bordered input w-full"
          defaultValue={
            props.releaseData.dataSharingGlobus?.globusResearcherUsername
          }
          disabled={props.releasePatchMutator.isPending}
          onBlur={(e) => {
            if (
              e.target.value !=
              props.releaseData.dataSharingGlobus?.globusResearcherUsername
            )
              props.releasePatchMutator.mutate({
                op: "replace",
                path: "/dataSharingConfiguration/globusResearcherUsername",
                value: e.target.value,
              });
          }}
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">
            Verify that researcher Globus username is correct{" "}
          </span>
        </label>
        <button
          type="button"
          className="btn-normal w-fit"
          onClick={() => {
            globusVerifyUsernameTriggerMutate.mutate({
              username:
                props.releaseData.dataSharingGlobus?.globusResearcherUsername ??
                "",
            });
          }}
          disabled={
            // can't be already running a job
            !!props.releaseData.runningJob ||
            // can't be within our own trigger operation
            globusVerifyUsernameTriggerMutate.isPending ||
            // can't be started whilst other fields are being mutated
            props.releasePatchMutator.isPending ||
            //  needs to be working
            !props.globusWorking
          }
        >
          Verify Globus username
        </button>
        {globusVerifyUsernameTriggerMutate.isSuccess && (
          <span className="label-text-alt mt-2 text-success">
            {globusVerifyUsernameTriggerMutate.data?.found
              ? "Valid Globus identity"
              : "No Globus identity found for this username"}
          </span>
        )}
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Authorise with Globus </span>
        </label>
        <button
          type="button"
          className="btn-normal w-fit"
          onClick={() => {
            window.location.href = `/api/globus/authorise?releaseKey=${props.releaseKey}`;
          }}
          disabled={!props.globusWorking}
        >
          Authorise
        </button>
        {justAuthorised && (
          <span className="label-text-alt mt-2 text-success">
            Successfully authorised with Globus
          </span>
        )}
        {globusAuthError && (
          <span className="label-text-alt mt-2 text-error">
            Globus authorisation attempt failed
          </span>
        )}
      </div>
    </>
  );
};
