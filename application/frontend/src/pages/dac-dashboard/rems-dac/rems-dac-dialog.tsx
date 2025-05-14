import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RemsApprovedApplicationType } from "../../../../../backend/src/shared/schemas";
import { useForm } from "react-hook-form";
import { isNil } from "lodash";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "../../../components/errors";
import { Table } from "../../../components/tables";
import { SuccessCancelButtons } from "../../../components/success-cancel-buttons";
import { useTRPC } from "../../../helpers/trpc-modern.ts";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
  dacId: string;
};

export const RemsDacDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
  dacId,
}) => {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { register, watch, reset } = useForm<{ newId: number }>();

  const newId = watch("newId");

  const cancelButtonRef = useRef(null);

  const [lastMutateError, setLastMutateError] = useState<string | undefined>(
    undefined,
  );

  const createNewReleaseMutateOptions = trpc.dac.createNew.mutationOptions();
  const createNewReleaseMutate = useMutation(createNewReleaseMutateOptions);

  const detectNewReleaseQueryOptions = trpc.dac.detectNewQuery.queryOptions(
    { dacId: dacId },
    { enabled: false },
  );
  const detectNewReleaseQuery = useQuery(detectNewReleaseQueryOptions);

  useEffect(() => {
    // as soon as we enter 'showing' dialog state we want to fetch all the new
    // applications from the REMS instance
    if (showing) {
      detectNewReleaseQuery.refetch();
    } else {
      // once not showing we want to reset back to initial state
      setLastMutateError(undefined);
      reset();
    }
  }, [showing]);

  const data = detectNewReleaseQuery?.data as
    | RemsApprovedApplicationType[]
    | undefined;

  return (
    <ErrorBoundary>
      <SelectDialogBase
        showing={showing}
        cancelShowing={cancelShowing}
        title={"Add Application"}
        buttons={
          <>
            <SuccessCancelButtons
              isLoading={createNewReleaseMutate.isPending}
              isSuccessDisabled={
                createNewReleaseMutate.isPending || isNil(newId)
              }
              successButtonLabel={"Add"}
              onSuccess={() => {
                createNewReleaseMutate.mutate(
                  { dacId: dacId, dacData: newId },
                  {
                    onSuccess: (newReleaseKey) => {
                      // invalidate the keys so that going to the dashboard will be refreshed
                      queryClient.invalidateQueries().then(() => {
                        // bounce us to the details page for the release we just made
                        navigate(`/releases/${newReleaseKey}/detail`);
                      });

                      // now close the dialog
                      cancelShowing();
                    },
                    onError: (err: any) =>
                      setLastMutateError(err?.response?.data?.detail),
                  },
                );
              }}
              cancelButtonLabel={"Cancel"}
              onCancel={cancelShowing}
              cancelButtonRef={cancelButtonRef}
            />
          </>
        }
        content={
          <>
            <div className="prose mt-2">
              <p className="text-sm text-gray-500">
                This is a list of applications in the given REMS instance that
                are
                <ul className="list-disc text-sm text-gray-500">
                  <li>approved</li>
                  <li>not already associated with an Elsa Data release</li>
                  <li>
                    involve a resource that corresponds to a dataset under Elsa
                    Data control
                  </li>
                </ul>
              </p>
            </div>
            <Table
              additionalTableClassName="mt-4 text-sm"
              tableBody={
                detectNewReleaseQuery.isSuccess &&
                data &&
                data
                  .sort((a, b) => a.when.localeCompare(b.when))
                  .map((nr) => (
                    <tr>
                      <td>
                        <input
                          type="radio"
                          value={nr.remsId}
                          {...register("newId", {
                            required: false,
                          })}
                        />
                      </td>
                      <td className="border p-2">{nr.when}</td>
                      <td className="border p-2">{nr.whoDisplay}</td>
                      <td className="border p-2">{nr.description}</td>
                    </tr>
                  ))
              }
            />
          </>
        }
        errorMessage={lastMutateError}
        initialFocus={cancelButtonRef}
      />
    </ErrorBoundary>
  );
};
