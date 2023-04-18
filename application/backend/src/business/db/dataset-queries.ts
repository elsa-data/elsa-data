import e from "../../../dbschema/edgeql-js";
import { makeSystemlessIdentifierArray } from "./helper";

/**
 * An EdgeDb query for counting datasets.
 */

export const selectDatasetPatientByExternalIdentifiersQuery = (exId: string) =>
  e.select(e.dataset.DatasetPatient, (dp) => ({
    filter: e.op(
      dp.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(exId)
    ),
  }));

export const selectDatasetCaseByExternalIdentifiersQuery = (exId: string) =>
  e.select(e.dataset.DatasetCase, (dc) => ({
    filter: e.op(
      dc.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(exId)
    ),
  }));

export const selectDatasetIdByDatasetUri = (datasetUri: string) =>
  e
    .select(e.dataset.Dataset, (d) => ({
      id: true,
      filter: e.op(d.uri, "ilike", datasetUri),
    }))
    .assert_single();
