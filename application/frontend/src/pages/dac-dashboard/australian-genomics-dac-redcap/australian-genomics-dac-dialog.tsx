import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isNil, isNumber } from "lodash";
import { REACT_QUERY_RELEASE_KEYS } from "../../releases/queries";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";
import { Table } from "../../../components/tables";
import { trpc } from "../../../helpers/trpc";
import { SuccessCancelButtons } from "../../../components/success-cancel-buttons";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
  dacId: string;
  possibleApplications: AustraliaGenomicsDacRedcap[];
  initialError?: string;
};

export const AustralianGenomicsDacDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
  dacId,
  possibleApplications,
  initialError,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const cancelButtonRef = useRef(null);

  const [lastError, setLastError] = useState<string | undefined>();
  useEffect(() => setLastError(initialError), [initialError]);

  const createNewReleaseMutate = trpc.dac.createNew.useMutation();

  /*const createNewReleaseMutatex = useMutation((d: AustraliaGenomicsDacRedcap) =>
    axios
      .post<string>(`/api/dac/redcap/new`, d)
      .then((response) => response.data)
  ); */

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
            </p>
            <ul className="list-disc text-sm text-gray-500">
              <li>not already associated with an Elsa Data release</li>
              <li>
                involve a resource that corresponds to a dataset under Elsa Data
                control
              </li>
            </ul>
          </div>
          <Table
            additionalTableClassName="mt-4 text-sm"
            tableBody={
              possibleApplications &&
              possibleApplications.map((pa, paIndex) => (
                <tr key={paIndex}>
                  <td>
                    <input
                      type="radio"
                      defaultChecked={selectedRowIndex === paIndex}
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
              ))
            }
          />
        </>
      }
      buttons={
        <SuccessCancelButtons
          isLoading={createNewReleaseMutate.isLoading}
          isSuccessDisabled={isNil(selectedRowIndex)}
          successButtonLabel={"Add"}
          onSuccess={() => {
            if (isNumber(selectedRowIndex))
              createNewReleaseMutate.mutate(
                {
                  dacId: dacId,
                  dacData: possibleApplications[selectedRowIndex],
                },
                {
                  onSuccess: (newReleaseKey) => {
                    // invalidate the keys so that going to the dashboard will be refreshed
                    queryClient
                      .invalidateQueries(REACT_QUERY_RELEASE_KEYS.all)
                      .then(() => {
                        // bounce us to the details page for the release we just made
                        navigate(`/releases/${newReleaseKey}/detail`);
                      });

                    // now close the dialog
                    closeDialog();
                  },
                  onError: (err: any) =>
                    setLastError(err?.response?.data?.detail),
                },
              );
            else {
              // this should not be possible as the button is disabled whilst the row index is null
              setLastError("Selected row index is null");
            }
          }}
          cancelButtonLabel={"Cancel"}
          onCancel={closeDialog}
          cancelButtonRef={cancelButtonRef}
        />
      }
      errorMessage={lastError}
    />
  );
};
