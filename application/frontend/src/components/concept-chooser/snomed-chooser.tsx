import React, { Dispatch } from "react";
import { ConceptDictionary } from "./concept-chooser-types";
import { ConceptChooser } from "./concept-chooser";
import { addToSelected, removeFromSelected } from "./concept-chooser-utils";
import { ApplicationCodedCodingType } from "@umccr/elsa-types";

type Props = {
  label: string;
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: ApplicationCodedCodingType[];

  addToSelected(code: ApplicationCodedCodingType): void;
  removeFromSelected(system: string, code: string): void;

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
      ontoServerUrl="https://onto.prod.umccr.org/fhir"
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
