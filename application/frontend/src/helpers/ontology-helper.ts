import axios from "axios";
import { CodingType } from "@umccr/elsa-types";
import {
  countriesEnglishNames,
  ISO3166_SYTEM_URI,
} from "../ontology/countries";

export const ontologyLookupCache: { [systemCode: string]: string } = {};

export function makeCacheEntry(system: string, code: string) {
  return `${system}---${code}`;
}
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
  // console.log(`Doing a code lookup of ${JSON.stringify(codes)}`);

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

    // if we have seen this system/code before then we do not need to do lookups
    // (the display value for an ontology code is going to evolve/change much slower than any possible
    // browser/react session would last so we don't really even need to be clever here)
    if (makeCacheEntry(c.system, c.code) in ontologyLookupCache) {
      c.display = ontologyLookupCache[makeCacheEntry(c.system, c.code)];

      continue;
    }

    // a hack before we put countries up into ontoserver
    if (c.system === ISO3166_SYTEM_URI) {
      if (c.code in countriesEnglishNames)
        c.display = countriesEnglishNames[c.code];

      // whether we find the code or not we continue as this will never be found in ontoserver
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

  let results = null;

  try {
    results = await axios
      .post(ontoUrl, bundle, {
        headers: {
          "Content-Type": "application/fhir+json",
          Accept: "application/fhir+json",
        },
        timeout: 500,
      })
      .then((res) => res.data);
  } catch (e) {
    console.log(e);
  }

  // the results array will come back with equivalence to the codes we sent
  // in - so we use an index to help us jump across to the codes
  let entryCount = 0;

  for (const entry of results?.entry || []) {
    if (entry?.response?.status === "200") {
      for (const param of entry?.resource?.parameter || []) {
        if (param?.name === "display") {
          const cacheEntry = makeCacheEntry(
            entryToCodeMap[entryCount].system,
            entryToCodeMap[entryCount].code
          );
          ontologyLookupCache[cacheEntry] = param?.valueString;
          entryToCodeMap[entryCount].display = param?.valueString;
        }
      }
    } else {
      console.log(
        `Dropping code ${JSON.stringify(codes[entryCount])} as the lookup of ` +
        `it resulted in ${JSON.stringify(entry?.response)}`
      );
    }
    entryCount++;
  }

  return codes;
}
