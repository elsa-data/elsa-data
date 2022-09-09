import e from "../../../dbschema/edgeql-js";

export function makeSystemlessIdentifier(entry1: string) {
  return e.tuple({ system: "", value: entry1 });
}

/**
 * Make an identifier array (array of tuples) where there is only
 * one entry and it is an identifier with value only (no system)
 *
 * @param entry1
 */
export function makeSystemlessIdentifierArray(entry1: string) {
  return e.array([makeSystemlessIdentifier(entry1)]);
}

/**
 * Make an identifier array (array of tuples) that is empty.
 */
export function makeEmptyIdentifierArray() {
  const tupleArrayType = e.array(e.tuple({ system: e.str, value: e.str }));

  return e.cast(tupleArrayType, e.literal(tupleArrayType, []));
}
