import { Concept, ConceptDictionary } from "./concept-chooser-types";
import React, { Dispatch } from "react";
import { ConceptChooser } from "./concept-chooser";
import { CodingType } from "@umccr/elsa-types";

type Props = {
  selected: CodingType[];

  addToSelected(code: CodingType): void;
  removeFromSelected(system: string, code: string): void;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const MondoChooser: React.FC<Props> = ({
  selected,
  addToSelected,
  removeFromSelected,
  disabled,
}) => {
  return (
    <ConceptChooser
      ontoServerUrl="https://onto.prod.umccr.org/fhir"
      systemUri="http://purl.obolibrary.org/obo/mondo.owl?vs"
      //systemVersion="2022-03-01"
      rootConceptId="MONDO:0000001"
      label="Monash Disease Ontology"
      placeholder="e.g. heart cancer, Usher syndrome"
      codePrefix="MONDO"
      selected={selected}
      disabled={disabled}
      addToSelected={addToSelected}
      removeFromSelected={removeFromSelected}
    />
  );
};
