import axios from "axios";
import { CodingType } from "@umccr/elsa-types";

/**
 * Do a batch lookup at a single Ontoserver endpoint for any concepts that do not yet have
 * a display component - and then fill that in.
 *
 * @param ontoUrl the URL of the ontology server FHIR endpoint
 * @param codes the array of codes that may or may not have a display field
 * @param forceAllRefresh if true then fetch and set the display field of all codes, irrespective of already set
 */
export async function doBatchLookup(
  ontoUrl: string,
  codes: CodingType[],
  forceAllRefresh: boolean = false
): Promise<CodingType[]> {
  if (codes.length === 0) return codes;

  const bundle = {
    type: "batch",
    resourceType: "Bundle",
    entry: [] as any[],
  };

  // we need to keep track of which entries that come back from the Ontoserver correspond
  // to which code in the array that went in
  const entryToCodeMap: { [entryCount: number]: CodingType } = {};

  let entryToCodeCount = 0;

  for (const c of codes) {
    // if there is already a display value set then we do not need to do lookups
    if (c.display && !forceAllRefresh) {
      continue;
    }

    entryToCodeMap[entryToCodeCount] = c;
    entryToCodeCount++;

    bundle.entry.push({
      request: {
        method: "POST",
        url: "CodeSystem/$lookup",
      },
      resource: {
        resourceType: "Parameters",
        parameter: [
          {
            valueUri: c.system,
            name: "system",
          },
          {
            valueCode: c.code,
            name: "code",
          },
        ],
      },
    });
  }

  const results = await axios
    .post(ontoUrl, bundle, {
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    })
    .then((res) => res.data);

  // the results array will come back with equivalence to the codes we sent
  // in - so we use an index to help us jump across to the codes
  let entryCount = 0;

  for (const entry of results?.entry || []) {
    if (entry?.response?.status === "200") {
      for (const param of entry?.resource?.parameter || []) {
        if (param?.name === "display")
          entryToCodeMap[entryCount].display = param?.valueString;
      }
    } else {
      console.log(
        `Dropping code ${codes[entryCount]} as the lookup of it resulted in ${entry?.response}`
      );
    }
    entryCount++;
  }

  return codes;
}
