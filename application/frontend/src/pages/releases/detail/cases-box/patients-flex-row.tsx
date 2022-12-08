import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDna,
  faFemale,
  faMale,
  faQuestion,
  faLock,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";

import { ReleasePatientType } from "@umccr/elsa-types";
import { useMutation, useQueryClient } from "react-query";
import classNames from "classnames";
import Popup from "reactjs-popup";
import { ConsentPopup } from "./consent-popup";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../queries";
import { ReleaseTypeLocal } from "../shared-types";

type Props = {
  releaseId: string;
  patients: ReleasePatientType[];
  showCheckboxes: boolean;
};

/**
 * The patient flex row is a flex row div that displays all the individuals in
 * a case, including listing their sample ids. It also draws icons to give extra
 * data about the patient/samples in a compact form.
 *
 * @param releaseId
 * @param patients
 * @param showCheckboxes
 * @constructor
 */
export const PatientsFlexRow: React.FC<Props> = ({
  releaseId,
  patients,
  showCheckboxes,
}) => {
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseId}`),
    {
      // we want to trigger the refresh of the entire release page
      // TODO can we optimise this to just invalidate the cases?
      onSuccess: async (result: ReleaseTypeLocal) =>
        await queryClient.invalidateQueries(),
    }
  );

  const onSelectChange = async (id: string) => {
    releasePatchMutate.mutate({
      op: "add",
      path: "/specimens",
      value: [id],
    });
  };

  const onUnselectChange = async (id: string) => {
    releasePatchMutate.mutate({
      op: "remove",
      path: "/specimens",
      value: [id],
    });
  };

  const patientDiv = (patient: ReleasePatientType) => {
    let patientIcon = <FontAwesomeIcon icon={faQuestion} />;
    let patientClasses = [
      "p-2",
      "border",
      "border-slate-200",
      "flex",
      "flex-col",
      "lg:flex-row",
      "lg:justify-between",
    ];

    // the select/unselect operation can be a bit complex on the backend - so we want to give visual feedback
    // as the operation applies
    if (releasePatchMutate.isLoading) patientClasses.push("opacity-50");

    // at these sizes on screen the icons are barely distinguishable but whatever
    if (patient.sexAtBirth === "male") {
      patientIcon = <FontAwesomeIcon icon={faMale} />;
    }
    if (patient.sexAtBirth === "female") {
      patientIcon = <FontAwesomeIcon icon={faFemale} />;
      // as per a pedigree chart - rounded=female
      patientClasses.push("rounded-xl");
    }

    return (
      <div className={classNames(...patientClasses)}>
        <span>
          {patient.externalId} {patientIcon}
          {patient.customConsent && (
            <>
              {"-"}
              <ConsentPopup releaseId={releaseId} nodeId={patient.id} />
            </>
          )}
        </span>
        <ul key={patient.id}>
          {patient.specimens.map((spec) => (
            <li key={spec.id} className="text-left lg:text-right">
              <FontAwesomeIcon icon={faDna} />
              {spec.customConsent && (
                <>
                  {"-"}
                  <ConsentPopup releaseId={releaseId} nodeId={spec.id} />
                </>
              )}{" "}
              {showCheckboxes && (
                <label>
                  {spec.externalId}
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={spec.nodeStatus == "selected"}
                    onChange={async (ce) =>
                      ce.target.checked
                        ? await onSelectChange(spec.id)
                        : await onUnselectChange(spec.id)
                    }
                  />
                </label>
              )}
              {!showCheckboxes && <span>{spec.externalId}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // TODO: possibly chose the number of grid columns based on the number of patients

  return (
    <div className="grid grid-flow-row-dense grid-cols-3 gap-2">
      {patients.map((pat, index) => patientDiv(pat))}
    </div>
  );
};
