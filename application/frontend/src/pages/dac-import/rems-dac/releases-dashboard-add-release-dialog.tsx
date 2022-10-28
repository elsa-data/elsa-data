import React, { Fragment, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { useForm } from "react-hook-form";
import { isNil } from "lodash";
import { REACT_QUERY_RELEASE_KEYS } from "../../releases/detail/queries";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
};

export const ReleasesAddReleaseDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, watch, reset } = useForm<{ newId: number }>();

  const newId = watch("newId");

  const cancelButtonRef = useRef(null);

  const [newReleases, setNewReleases] = useState<RemsApprovedApplicationType[]>(
    []
  );

  const [lastMutateError, setLastMutateError] = useState<string | undefined>(
    undefined
  );

  const createNewReleaseMutate = useMutation((n: number) =>
    axios
      .post<string>(`/api/dac/rems/new/${n}`, {})
      .then((response) => response.data)
  );

  useEffect(() => {
    async function fetchData() {
      const n = await axios
        .get<RemsApprovedApplicationType[]>(`/api/dac/rems/new`)
        .then((response) => response.data);
      setNewReleases(n);
    }
    // as soon as we enter 'showing' dialog state we want to fetch all the new
    // applications from the REMS instance
    if (showing) {
      fetchData().then();
    } else {
      // once not showing we want to reset back to initial state
      setNewReleases([]);
      setLastMutateError(undefined);
      reset();
    }
  }, [showing]);

  return (
    <SelectDialogBase
      showing={showing}
      cancelShowing={cancelShowing}
      title={"Add Application"}
      buttons={
        <>
          <button
            type="button"
            disabled={isNil(newId)}
            className="w-full inline-flex disabled:opacity-50 justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => {
              createNewReleaseMutate.mutate(newId, {
                onSuccess: (newReleaseId) => {
                  // invalidate the keys so that going to the dashboard will be refreshed
                  queryClient
                    .invalidateQueries(REACT_QUERY_RELEASE_KEYS.all)
                    .then(() => {
                      // bounce us to the details page for the release we just made
                      navigate(`/releases/${newReleaseId}`);
                    });

                  // now close the dialog
                  cancelShowing();
                },
                onError: (err: any) =>
                  setLastMutateError(err?.response?.data?.detail),
              });
            }}
          >
            Add
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => cancelShowing()}
            ref={cancelButtonRef}
          >
            Cancel
          </button>{" "}
        </>
      }
      content={
        <>
          <div className="mt-2 prose">
            <p className="text-sm text-gray-500">
              This is a list of applications in the given REMS instance that are
              <ul className="text-sm text-gray-500 list-disc">
                <li>approved</li>
                <li>not already associated with an Elsa Data release</li>
                <li>
                  involve a resource that corresponds to a dataset under Elsa
                  Data control
                </li>
              </ul>
            </p>
          </div>
          <table className="w-full table-auto text-sm mt-4">
            <tbody>
              {newReleases &&
                newReleases
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
                  ))}
            </tbody>
          </table>
        </>
      }
      errorMessage={lastMutateError}
      initialFocus={cancelButtonRef}
    />
  );
};
