import { Concept, ConceptDictionary } from "./concept-chooser-types";
import React, { Dispatch } from "react";
import { ConceptChooser } from "./concept-chooser";
import { CodingType } from "@umccr/elsa-types";

type Props = {
  label: string;

  // the list of currently selected concepts
  selected: CodingType[];

  addToSelected(coding: CodingType): void;
  removeFromSelected(coding: CodingType): void;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const MondoChooser: React.FC<Props & { className: string }> = ({
  label,
  selected,
  addToSelected,
  removeFromSelected,
  disabled,
  className,
}) => {
  return (
    <ConceptChooser
      className={className}
      systemUri="http://purl.obolibrary.org/obo/mondo.owl?vs"
      //systemVersion="2022-03-01"
      rootConceptId="MONDO:0000001"
      label={label}
      placeholder="e.g. heart cancer, Usher syndrome"
      codePrefix="MONDO"
      selected={selected}
      disabled={disabled}
      addToSelected={addToSelected}
      removeFromSelected={removeFromSelected}
    />
  );
};
