import React, { Dispatch } from "react";
import { ConceptDictionary } from "./concept-chooser-types";
import { ConceptChooser } from "./concept-chooser";
import { addToSelected, removeFromSelected } from "./concept-chooser-utils";
import { CodingType } from "@umccr/elsa-types";

type Props = {
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: CodingType[];

  setSelected: Dispatch<React.SetStateAction<CodingType[]>>;
  setIsDirty: Dispatch<React.SetStateAction<boolean>>;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const SnomedChooser: React.FC<Props> = ({
  selected,
  setSelected,
  setIsDirty,
  disabled,
}) => {
  return (
    <ConceptChooser
      ontoServerUrl="https://onto.prod.umccr.org/fhir"
      systemUri="http://snomed.info/sct/32506021000036107/version/20210731?fhir_vs=refset/32570581000036105"
      systemVersion="http://snomed.info/sct|http://snomed.info/sct/32506021000036107/version/20210731"
      rootConceptId="HP:0000118"
      label="Disease Specific Study of Condition(s)"
      placeholder="e.g. ataxia, hypoplasia"
      codePrefix="SNOMED"
      selected={selected}
      disabled={disabled}
      addToSelected={(code) => {
        addToSelected(setSelected, code);
        setIsDirty(true);
      }}
      removeFromSelected={(system, code) => {
        removeFromSelected(setSelected, system, code);
        setIsDirty(true);
      }}
    />
  );
};
