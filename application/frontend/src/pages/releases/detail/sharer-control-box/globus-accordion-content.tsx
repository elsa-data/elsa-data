import React, { PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import type { ReleasePatchOperationType } from "../../../../../../backend/src/shared/schemas-release-operations";
import { SharereGlobusType } from "../../../../../../backend/src/config/config-schema-sharer";
import { EagerErrorBoundary } from "../../../../components/errors";
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
  globusSetting: SharereGlobusType; // TODO: Fix Typo
  globusWorking: boolean;
};

export const GlobusAccordionContent: React.FC<
  PropsWithChildren<GlobusAccordionContentProps>
> = (props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const justAuthorised = searchParams.get("globusAuthorised") === "true";

  // const globusAuthoriseOptions = trpc.releaseJob.authoriseGlobus.mutationOptions({
  //   onSuccess: async () => {
  //     await queryClient.invalidateQueries(); // TODO: what does this do?

  //     window.scrollTo({
  //       top: 0,
  //       left: 0,
  //       behavior: "smooth",
  //     });
  //   },
  // });

  const globusVerifyUsernameTriggerMutate = useMutation(
    trpc.releaseJob.verifyGlobusUsername.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    }),
  );

  // const globusTriggerMutate = useMutation(globusAuthoriseOptions);

  // const error = globusTriggerMutate.error;
  // const isError = globusTriggerMutate.isError;

  // {isError && <EagerErrorBoundary error={error} />}
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
          disabled={
            // can't be already running a job
            !!props.releaseData.runningJob ||
            // must be activated
            // !props.releaseData.activation ||
            // can't be within our own trigger operation
            // globusVerifyUsernameTriggerMutate.isPending ||
            // can't be started whilst other fields are being mutated
            // props.releasePatchMutator.isPending ||
            // needs to be working
            //
            // TODO: Think of sensible guards here
            !props.globusWorking
          }
        >
          Authorise
        </button>
        {justAuthorised && (
          <span className="label-text-alt mt-2 text-success">
            Successfully authorised with Globus
          </span>
        )}
      </div>
    </>
  );
};
