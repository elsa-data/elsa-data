import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { isNil, isNumber } from "lodash";
import { REACT_QUERY_RELEASE_KEYS } from "../../releases/queries";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
  possibleApplications: AustraliaGenomicsDacRedcap[];
  initialError?: string;
};

export const AustralianGenomicsDacDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
  possibleApplications,
  initialError,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const cancelButtonRef = useRef(null);

  const [lastError, setLastError] = useState<string | undefined>();
  useEffect(() => setLastError(initialError), [initialError]);

  const createNewReleaseMutate = useMutation((d: AustraliaGenomicsDacRedcap) =>
    axios
      .post<string>(`/api/dac/redcap/new`, d)
      .then((response) => response.data)
  );

  const closeDialog = () => {
    setSelectedRowIndex(null);
    cancelShowing();
  };

  return (
    <SelectDialogBase
      showing={showing}
      cancelShowing={closeDialog}
      initialFocus={cancelButtonRef}
      title={"Add Application"}
      content={
        <>
          <div className="prose mt-2">
            <p className="text-sm text-gray-500">
              This is a list of applications in CSV extracted from the
              Australian Genomics Redcap instance that are
              <ul className="list-disc text-sm text-gray-500">
                <li>not already associated with an Elsa Data release</li>
                <li>
                  involve a resource that corresponds to a dataset under Elsa
                  Data control
                </li>
              </ul>
            </p>
          </div>
          <table className="mt-4 w-full table-auto text-sm">
            <tbody>
              {possibleApplications &&
                possibleApplications.map((pa, paIndex) => (
                  <tr>
                    <td>
                      <input
                        type="radio"
                        checked={selectedRowIndex === paIndex}
                        onClick={() => {
                          // clear any previous errors
                          setLastError(undefined);
                          // change the row index
                          setSelectedRowIndex(paIndex);
                        }}
                      />
                    </td>
                    <td className="border p-2">{pa.application_date_hid}</td>
                    <td className="border p-2">{pa.daf_applicant_name}</td>
                    <td className="border p-2">{pa.daf_project_title}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      }
      buttons={
        <>
          <button
            type="button"
            disabled={isNil(selectedRowIndex)}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => {
              if (isNumber(selectedRowIndex))
                createNewReleaseMutate.mutate(
                  possibleApplications[selectedRowIndex],
                  {
                    onSuccess: (newReleaseId) => {
                      // invalidate the keys so that going to the dashboard will be refreshed
                      queryClient
                        .invalidateQueries(REACT_QUERY_RELEASE_KEYS.all)
                        .then(() => {
                          // bounce us to the details page for the release we just made
                          navigate(`/releases/${newReleaseId}`);
                        });

                      // now close the dialog
                      closeDialog();
                    },
                    onError: (err: any) =>
                      setLastError(err?.response?.data?.detail),
                  }
                );
              else {
                // this should not be possible as the button is disabled whilst the row index is null
                setLastError("Selected row index is null");
              }
            }}
          >
            Add
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => closeDialog()}
            ref={cancelButtonRef}
          >
            Cancel
          </button>
        </>
      }
      errorMessage={lastError}
    />
  );
};
