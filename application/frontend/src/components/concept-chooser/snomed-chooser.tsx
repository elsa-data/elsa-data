import React from "react";
import { ConceptChooser } from "./concept-chooser";
import type { CodingType } from "./concept-chooser-types";

type Props = {
  label: string;

  className?: string;

  // the list of currently selected concepts
  selected: CodingType[];

  // mutation functions for the selected list
  addToSelected(coding: CodingType): void;
  removeFromSelected(coding: CodingType): void;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const SnomedChooser: React.FC<Props> = ({
  label,
  className,
  selected,
  addToSelected,
  removeFromSelected,
  disabled,
}) => {
  // const SNOMED_RELEASE = "20250930";
  const SNOMED_AU = "32506021000036107";
  const SNOMED_ISA = "363137000";

  const SNOMED_SYSTEM_URI = `http://snomed.info/sct/${SNOMED_AU}?fhir_vs=isa/${SNOMED_ISA}`;
  //const SNOMED_SYSTEM_VERSION = `http://snomed.info/sct/${SNOMED_AU}/version/${SNOMED_RELEASE}`

  // version=http://snomed.info/sct/32506021000036107/version/20250930
  // valueset=http://snomed.info/sct/32506021000036107/fhir_vs&fhir=https%3A%2F%2Ftx.ontoserver.csiro.au%2Ffhir

  return (
    <ConceptChooser
      className={className}
      systemUri={SNOMED_SYSTEM_URI}
      //systemVersion={SNOMED_SYSTEM_VERSION}
      rootConceptId="363137000"
      label={label}
      placeholder="e.g. ataxia, hypoplasia"
      codePrefix=""
      selected={selected}
      disabled={disabled}
      addToSelected={addToSelected}
      removeFromSelected={removeFromSelected}
    />
  );
};
