import React from "react";
import { ConceptChooser } from "./concept-chooser";
import { CodingType } from "@umccr/elsa-types";

type Props = {
  label: string;

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
  selected,
  addToSelected,
  removeFromSelected,
  disabled,
}) => {
  return (
    <ConceptChooser
      systemUri="http://snomed.info/sct/32506021000036107/version/20210731?fhir_vs=refset/32570581000036105"
      systemVersion="http://snomed.info/sct|http://snomed.info/sct/32506021000036107/version/20210731"
      rootConceptId="HP:0000118"
      label={label}
      placeholder="e.g. ataxia, hypoplasia"
      codePrefix="SNOMED"
      selected={selected}
      disabled={disabled}
      addToSelected={addToSelected}
      removeFromSelected={removeFromSelected}
    />
  );
};
