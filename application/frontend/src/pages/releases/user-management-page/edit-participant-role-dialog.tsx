import React, { useRef, useState } from "react";
import { EagerErrorBoundary } from "../../../components/errors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { trpc } from "../../../helpers/trpc";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";
import {
  ReleaseParticipantRoleType,
  ReleaseParticipantType,
} from "@umccr/elsa-types";
import { SuccessCancelButtons } from "../../../components/success-cancel-buttons";

type EditParticipantRoleDialogProps = {
  releaseKey: string;
  releaseParticipant: ReleaseParticipantType;
};
export const EditParticipantRoleDialog: React.FC<
  EditParticipantRoleDialogProps
> = ({ releaseKey, releaseParticipant }) => {
  const { email, role, roleAlterOptions } = releaseParticipant;

  // Some boolean values for component to show or not
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const utils = trpc.useContext();

  // A function when dialog is closed
  const cancelButtonRef = useRef(null);
  const cancelButton = () => {
    setIsDialogOpen(false);
  };

  // New Role data
  const [newRole, setNewRole] = useState<ReleaseParticipantRoleType | null>(
    role as ReleaseParticipantRoleType,
  );

  // Mutating the participant role
  const participantMutate = trpc.releaseParticipant.editParticipant.useMutation(
    {
      onSuccess: () => {
        utils.releaseParticipant.getParticipants.invalidate();
        setIsDialogOpen(false);
      },
    },
  );

  // Parsing for easy access
  const isLoading = participantMutate.isLoading;
  const isError = participantMutate.isError;
  const error = participantMutate.error;

  return (
    <>
      <button
        className="btn-table-action-navigate"
        onClick={() => setIsDialogOpen((p) => !p)}
      >
        edit
      </button>
      <SelectDialogBase
        showing={isDialogOpen}
        cancelShowing={cancelButton}
        title="Participant Role Change"
        buttons={
          <SuccessCancelButtons
            isLoading={isLoading}
            isSuccessDisabled={isLoading && !!newRole}
            successButtonLabel={"Save"}
            onSuccess={() => {
              if (newRole) {
                participantMutate.mutate({
                  releaseKey: releaseKey,
                  email: email,
                  role: newRole,
                });
              }
            }}
            cancelButtonLabel={"Cancel"}
            onCancel={cancelButton}
            cancelButtonRef={cancelButtonRef}
          />
        }
        content={
          <>
            {isError && <EagerErrorBoundary error={error} />}

            <div className="prose mt-2">
              <p className="text-sm text-gray-500">
                This will allow to alter participant role in this release.
              </p>
            </div>

            <div className="mt-4 flex w-full flex-col">
              <div className="card rounded-box flex-grow ">
                <h3 className="font-semibold">Participant Information</h3>

                <div className="mt-1">
                  <label className="label">
                    <span className="label-text text-sm font-medium">
                      {`Email`}
                    </span>
                  </label>
                  <input
                    value={releaseParticipant.email}
                    type="text"
                    className="input-bordered input input-sm !m-0 w-full "
                    disabled
                  />
                  <label className="label">
                    <span className="label-text text-sm font-medium">
                      {`Role`}
                    </span>
                  </label>
                  {roleAlterOptions && (
                    <select
                      className="select-bordered select select-sm w-full"
                      onChange={(e) => {
                        setNewRole(
                          e.target.value as ReleaseParticipantRoleType,
                        );
                      }}
                      value={newRole ?? undefined}
                    >
                      <option disabled>Role</option>
                      {roleAlterOptions.map((role, key) => (
                        <option key={key}>{role}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </>
        }
        initialFocus={cancelButtonRef}
      />
    </>
  );
};
