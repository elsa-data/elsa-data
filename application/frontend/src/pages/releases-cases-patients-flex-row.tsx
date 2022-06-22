import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDna,
  faFemale,
  faMale,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";

import { ReleasePatientType } from "@umccr/elsa-types";
import axios from "axios";
import { useQueryClient } from "react-query";
import classNames from "classnames";

type Props = {
  releaseId: string;
  patients: ReleasePatientType[];
  showCheckboxes: boolean;
};

export const ReleasesCasesPatientsFlexRow: React.FC<Props> = ({
  releaseId,
  patients,
  showCheckboxes,
}) => {
  const queryClient = useQueryClient();

  const onSelectChange = async (id: string) => {
    await axios.post<any>(`/api/releases/${releaseId}/specimens/select`, [id]);
    await queryClient.invalidateQueries();
  };

  const onUnselectChange = async (id: string) => {
    await axios.post<any>(`/api/releases/${releaseId}/specimens/unselect`, [
      id,
    ]);
    await queryClient.invalidateQueries();
  };

  const patientDiv = (patient: ReleasePatientType) => {
    let patientIcon = <FontAwesomeIcon icon={faQuestion} />;
    let patientClasses = [
      "p-2",
      "border-gray-500",
      "border",
      "flex",
      "justify-between",
    ];

    if (patient.sexAtBirth === "male") {
      patientIcon = <FontAwesomeIcon icon={faMale} />;
    }
    if (patient.sexAtBirth === "female") {
      patientIcon = <FontAwesomeIcon icon={faFemale} />;
      patientClasses.push("rounded-xl");
    }

    // if we have a specimen then there is no benefit to displaying two levels here - we can merge
    // into one combined patient/specimen
    if (patient.specimens.length === 1) {
      const specimen = patient.specimens[0];
      return (
        <div className={classNames(...patientClasses)}>
          <span>
            {patientIcon}/<FontAwesomeIcon icon={faDna} /> {patient.externalId}/
            {specimen.externalId}
          </span>
          {showCheckboxes && (
            <input
              type="checkbox"
              className="ml-2"
              checked={specimen.nodeStatus == "selected"}
              onChange={async (ce) =>
                ce.target.checked
                  ? await onSelectChange(specimen.id)
                  : await onUnselectChange(specimen.id)
              }
            />
          )}
        </div>
      );
    }

    return (
      <div className={classNames(...patientClasses)}>
        <span>
          {patientIcon} {patient.externalId}
        </span>
        <ul key={patient.id}>
          {patient.specimens.map((spec) => (
            <li key={spec.id}>
              <FontAwesomeIcon icon={faDna} />
              {spec.externalId}
              {showCheckboxes && (
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
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="grid grid-flow-row-dense grid-cols-3 gap-2">
      {patients.map((pat, index) => patientDiv(pat))}
    </div>
  );

  return (
    <div className="flex flex-row flex-wrap space-x-2 space-y-2">
      {patients.map((pat, index) => patientDiv(pat))}
    </div>
  );
};
