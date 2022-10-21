import axios from "axios";
import { zipWith } from "lodash";
import LRUCache from "lru-cache";
import { Options as LRUCacheOptions } from "lru-cache";
import { CodingType } from "@umccr/elsa-types";
import {
  countriesEnglishNames,
  ISO3166_SYTEM_URI,
} from "../ontology/countries";
;

export type ResolvedCodingType = Omit<CodingType, "display"> & {
  display: string
};

export type LookupResult = {
  resolved: ResolvedCodingType[],
  unresolved: CodingType[],
}

// TODO: read this from config file
// The URL of the ontology server FHIR endpoint
const ONTO_URL = "https://onto.prod.umccr.org/fhir";

const ontologyLookupCache = new LRUCache<string, ResolvedCodingType>({
  max: 1024
});

function cacheKey(code: CodingType) {
  return JSON.stringify({code: code.code, system: code.system});
}

function mergeLookupResults(lookupResults: LookupResult[]): LookupResult {
  return {
    resolved:   lookupResults.flatMap(lookupResult => lookupResult.resolved),
    unresolved: lookupResults.flatMap(lookupResult => lookupResult.unresolved),
  };
}

function tryLookupInCode1(code: CodingType): LookupResult {
  const display = code.display;
  if (display === undefined) {
    return {resolved: [], unresolved: [code]};
  } else {
    return {resolved: [{display, ...code}], unresolved: []}
  }
}

function tryLookupInCache1(code: CodingType): LookupResult {
  const lookupResult = ontologyLookupCache.get(cacheKey(code));
  return {
    resolved:   lookupResult !== undefined ? [lookupResult] : [],
    unresolved: lookupResult === undefined ? [code] : [],
  };
}

function tryLookupInCountryMap1(code: CodingType): LookupResult {
  const lookupResult
    = code.system === ISO3166_SYTEM_URI && code.code in countriesEnglishNames
    ? {
      system: code.system,
      code: code.code,
      display: countriesEnglishNames[code.code]
    }
    : undefined;
  return {
    resolved:   lookupResult !== undefined ? [lookupResult] : [],
    unresolved: lookupResult === undefined ? [code] : [],
  }
}

async function tryLookupInCode(codes: CodingType[]): Promise<LookupResult> {
  return mergeLookupResults(codes.map(tryLookupInCode1));
}

async function tryLookupInCache(codes: CodingType[]): Promise<LookupResult> {
  return mergeLookupResults(codes.map(tryLookupInCache1));
}

async function tryLookupInCountryMap(codes: CodingType[]): Promise<LookupResult> {
  return mergeLookupResults(codes.map(tryLookupInCountryMap1));
}

async function tryLookupInOntoserver(codes: CodingType[]): Promise<LookupResult> {
  if (codes.length === 0) {
    return {resolved: [], unresolved: []};
  }

  const data = {
    type: "batch",
    resourceType: "Bundle",
    entry: codes.map(code => (
      {
        request: {
          method: "POST",
          url: "CodeSystem/$lookup",
        },
        resource: {
          resourceType: "Parameters",
          parameter: [
            {
              valueUri: code.system,
              name: "system",
            },
            {
              valueCode: code.code,
              name: "code",
            },
          ],
        },
      }
    )),
  };

  const config = {
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    timeout: 500,
  };

  let results = null;
  try {
    results = (await axios.post(ONTO_URL, data, config)).data
  } catch (e) {
    console.log(e);
    return {
      resolved: [],
      unresolved: codes,
    };
  }

  type EntryCodePair = {
    entry: any
    code: CodingType
  }

  function coerceEntryToArray(entry: any): any[] {
    return Array.isArray(entry) ? entry : [];
  }

  const entryCodePairs: EntryCodePair[] = zipWith(
    coerceEntryToArray(results?.entry),
    codes,
    (entry, code) => ({ entry: entry, code: code})
  );

  const resolved: ResolvedCodingType[] = [];
  const unresolved: CodingType[] = [];
  for (const pair of entryCodePairs) {
    if (pair.entry?.response?.status !== "200") {
      console.log(
        `Dropping code ${JSON.stringify(pair.code)} as the lookup of ` +
        `it resulted in ${JSON.stringify(pair.entry?.response)}`
      );
      unresolved.push(pair.code);
      continue;
    }
    for (const param of pair.entry?.resource?.parameter || []) {
      const name = param?.name;
      const valueString = param?.valueString;
      if (name !== "display") continue;
      if (valueString === undefined) continue;
      resolved.push(
        {
          code: pair.code.code,
          system: pair.code.system,
          display: String(valueString),
        }
      );
    }
  }
  return {resolved, unresolved};
}

/**
 * Put a concept which has a display component into the cache.
 *
 * @param code the code that has a display field
 */
export function putIntoCache(code: ResolvedCodingType) {
  ontologyLookupCache.set(cacheKey(code), code)
}

/**
 * Put many concepts which each have their own display component into the cache.
 *
 * @param codes the codes that have display fields
 */
export function putManyIntoCache(codes: ResolvedCodingType[]) {
  codes.forEach(putIntoCache);
}

/**
 * Do a lookup at a single Ontoserver endpoint for any concepts that do not yet have
 * a display component - and then fill that in.
 *
 * @param code the code that may or may not have a display field
 * @param forceAllRefresh if true then fetch and set the display field of all codes, irrespective of already set
 */
export async function doLookup(
  code: CodingType,
  forceRefresh: boolean = false,
): Promise<ResolvedCodingType | undefined> {
  return (await doBatchLookup([code], forceRefresh)).resolved[0];
}

/**
 * Do a batch lookup at a single Ontoserver endpoint for any concepts that do not yet have
 * a display component - and then fill that in.
 *
 * @param codes the array of codes that may or may not have a display field
 * @param forceAllRefresh if true then fetch and set the display field of all codes, irrespective of already set
 */
export async function doBatchLookup(
  codes: CodingType[],
  forceAllRefresh: boolean = false
): Promise<LookupResult> {
  const lookupFuncs = [
    ...(forceAllRefresh ? []: [tryLookupInCode]),
    ...(forceAllRefresh ? []: [tryLookupInCache]),
    tryLookupInCountryMap,
    tryLookupInOntoserver,
  ];

  // Do the lookup, falling back to later functions in `lookupFuncs` if earlier
  // ones return no result.
  let lookupResult: LookupResult = {
    resolved: [],
    unresolved: codes,
  };
  for (const lookupFunc of lookupFuncs) {
    const { resolved, unresolved } = await lookupFunc(lookupResult.unresolved);
    lookupResult = {
      resolved: lookupResult.resolved.concat(resolved),
      unresolved: unresolved,
    };
  }

  // Cache the lookup results
  putManyIntoCache(lookupResult.resolved);

  return lookupResult;
}
