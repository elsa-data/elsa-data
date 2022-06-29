import _ from "lodash";
import React, { Dispatch } from "react";
import { CodingType } from "@umccr/elsa-types";

/**
 * A function to safely add concept searched results into our state.
 *
 * @param setSelected the React dispatch action for changing state
 * @param concept the concept data to add
 */
export function addToSelected(
  setSelected: Dispatch<React.SetStateAction<CodingType[]>>,
  concept: CodingType
) {
  const permanentConcept = _.cloneDeep(concept);

  // our search process adds in some extra data to the concepts - which whilst not a massive problem - we
  // look to clean up before saving into the backend form data
  delete (permanentConcept as any)["hilighted"];
  delete (permanentConcept as any)["score"];

  setSelected((oldSelectedValue) => [...oldSelectedValue, permanentConcept]);
}

/**
 * A function to safely delete concepts from our state.
 *
 * @param setSelected the React dispatch action for changing state
 * @param system the concept id to delete
 * @param code the concept id to delete
 */
export function removeFromSelected(
  setSelected: Dispatch<React.SetStateAction<CodingType[]>>,
  system: string,
  code: string
) {
  setSelected((oldSelected) => {
    return oldSelected.filter(function (item) {
      return item.code !== code && item.system !== system;
    });
  });
}
