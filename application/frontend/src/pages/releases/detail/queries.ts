import axios from "axios";
import { ReleaseTypeLocal } from "./shared-types";
import { doBatchLookup } from "../../../helpers/ontology-helper";
import { QueryFunctionContext } from "react-query";
import { CodingType, ReleaseType } from "@umccr/elsa-types";

export const REACT_QUERY_RELEASE_KEYS = {
  all: ["releases"] as const,
  details: () => [...REACT_QUERY_RELEASE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...REACT_QUERY_RELEASE_KEYS.details(), id] as const,

  getReleaseId: (keys: readonly unknown[]) => keys[2],
};

export async function makeReleaseTypeLocal(
  releaseData: ReleaseType
): Promise<ReleaseTypeLocal> {
  // the release data comes with only terminology *codes* - so we need to lookup
  // the display terms for the UI
  if (releaseData.applicationCoded.type === "DS") {
    await doBatchLookup(
      "https://onto.prod.umccr.org/fhir",
      releaseData.applicationCoded.diseases
    );
  }

  // we want to make an immutable map of letters (e.g. uri => A,B...)
  // just for some UI optimisations which is why this is strictly local
  (releaseData as ReleaseTypeLocal).datasetMap = new Map(
    releaseData.datasetUris
      .sort()
      .map((duri, index) => [
        duri,
        String.fromCharCode(index + "A".charCodeAt(0)),
      ])
  );

  return releaseData as ReleaseTypeLocal;
}

export async function specificReleaseQuery(context: QueryFunctionContext) {
  const rid = REACT_QUERY_RELEASE_KEYS.getReleaseId(context.queryKey);

  const releaseData = await axios
    .get<ReleaseTypeLocal>(`/api/releases/${rid}`)
    .then((response) => response.data);

  return await makeReleaseTypeLocal(releaseData);
}

export async function specificReleaseCodingUpdate() {}
