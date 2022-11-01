import { Concept, ConceptDictionary } from "./concept-chooser-types";
import React, { Dispatch } from "react";
import { ConceptChooser } from "./concept-chooser";
import { addToSelected, removeFromSelected } from "./concept-chooser-utils";
import { CodingType } from "@umccr/elsa-types";

type Props = {
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: CodingType[];

  // the action to mutate concept state
  addToSelected(coding: CodingType): void;
  removeFromSelected(coding: CodingType): void;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const HgncChooser: React.FC<Props> = ({
  selected,
  addToSelected,
  removeFromSelected,
  disabled,
}) => {
  return (
    <ConceptChooser
      systemUri="http://www.genenames.org/geneId"
      systemVersion="http://www.genenames.org/geneId|2021-12-20"
      rootConceptId="xxx"
      label="Gene Specific Study"
      placeholder="e.g. SHOX2, AATF"
      codePrefix="HGNC"
      selected={selected}
      disabled={disabled}
      addToSelected={(coding) => {
        addToSelected(coding);
        //setIsDirty(true);
      }}
      removeFromSelected={(coding) => {
        removeFromSelected(coding);
        //setIsDirty(true);
      }}
    />
  );
};
