import axios from "axios";
import { ReleaseTypeLocal } from "./shared-types";
import { QueryFunctionContext } from "@tanstack/react-query";
import {
  ReleaseDetailType,
  ReleaseParticipantType,
  ReleasePatchOperationType,
} from "@umccr/elsa-types";
import { createDatasetMap } from "./dataset-map";

/**
 * These constants are a pattern that makes sure our react-query 'cache key' is
 * kept consistent no matter where it is performed.
 * Example usage is
 * REACT_QUERY_RELEASE_KEYS.all (cache key for the list of releases)
 */
export const REACT_QUERY_RELEASE_KEYS = {
  // methods to create react query keys of varying levels
  all: ["releases"] as const,
  details: () => [...REACT_QUERY_RELEASE_KEYS.all, "detail"] as const,
  participants: () =>
    [...REACT_QUERY_RELEASE_KEYS.all, "participants"] as const,
  detail: (id: string) => [...REACT_QUERY_RELEASE_KEYS.details(), id] as const,
  participant: (id: string) =>
    [...REACT_QUERY_RELEASE_KEYS.participants(), id] as const,
  cfn: (id: string) =>
    [...REACT_QUERY_RELEASE_KEYS.details(), id, "cfn"] as const,

  // an accessor function to get the release id back out of any given key array
  getReleaseId: (keys: readonly unknown[]) => keys[2],
};

export async function makeReleaseTypeLocal(
  releaseData: ReleaseDetailType
): Promise<ReleaseTypeLocal> {
  // the release data comes with only terminology *codes* - so we need to lookup
  // the display terms for the UI
  //if (releaseData.applicationCoded.type === "DS") {
  //  await doBatchLookup(
  //    "https://onto.prod.umccr.org/fhir",
  //    releaseData.applicationCoded.diseases
  //  );
  // }

  // we want to make an immutable map of letters (e.g. uri => A,B...)
  // just for some UI optimisations which is why this is strictly local
  (releaseData as ReleaseTypeLocal).datasetMap = createDatasetMap(
    releaseData.datasetUris
  );

  return releaseData as ReleaseTypeLocal;
}

export const axiosPostNullMutationFn = (apiUrl: string) => (c: null) =>
  axios
    .post<ReleaseDetailType>(apiUrl, null)
    .then((response) => makeReleaseTypeLocal(response.data));

export const axiosPostArgMutationFn =
  <T>(apiUrl: string) =>
  (c: T) =>
    axios
      .post<ReleaseDetailType>(apiUrl, c)
      .then((response) => makeReleaseTypeLocal(response.data));

export const axiosPatchOperationMutationFn =
  (url: string) => (c: ReleasePatchOperationType) =>
    axios
      .patch<ReleaseDetailType>(url, [c])
      .then((response) => makeReleaseTypeLocal(response.data));

export async function specificReleaseQuery(context: QueryFunctionContext) {
  const rid = REACT_QUERY_RELEASE_KEYS.getReleaseId(context.queryKey);

  const releaseData = await axios
    .get<ReleaseTypeLocal>(`/api/releases/${rid}`)
    .then((response) => response.data);

  return await makeReleaseTypeLocal(releaseData);
}

export async function specificReleaseParticipantsQuery(
  context: QueryFunctionContext
) {
  const rid = REACT_QUERY_RELEASE_KEYS.getReleaseId(context.queryKey);

  return await axios
    .get<ReleaseParticipantType[]>(`/api/releases/${rid}/participants`)
    .then((response) => response.data);
}

export async function specificReleaseCodingUpdate() {}
