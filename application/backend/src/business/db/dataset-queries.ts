import e from "../../../dbschema/edgeql-js";
import { makeSystemlessIdentifierArray } from "./helper";

/**
 * An EdgeDb query for datasets.
 */

/**
 * Selection Queries
 */
export const selectDatasetPatientByExternalIdAndDatasetUriQuery = ({
  exId,
  datasetUri,
}: {
  exId: string;
  datasetUri: string;
}) =>
  e.select(e.dataset.DatasetPatient, (dp) => ({
    filter_single: e.op(
      e.op(dp.externalIdentifiers, "=", makeSystemlessIdentifierArray(exId)),
      "and",
      e.op(dp.dataset.uri, "=", datasetUri)
    ),
  }));

export const selectDatasetSpecimenByExternalIdAndDatasetUriQuery = (
  exId: string,
  datasetUri: string
) =>
  e.select(e.dataset.DatasetSpecimen, (ds) => ({
    filter_single: e.op(
      e.op(ds.externalIdentifiers, "=", makeSystemlessIdentifierArray(exId)),
      "and",
      e.op(ds.dataset.uri, "=", datasetUri)
    ),
  }));
export const selectDatasetCaseByExternalIdAndDatasetUriQuery = ({
  exId,
  datasetUri,
}: {
  exId: string;
  datasetUri: string;
}) =>
  e.select(e.dataset.DatasetCase, (dc) => ({
    filter_single: e.op(
      e.op(dc.externalIdentifiers, "=", makeSystemlessIdentifierArray(exId)),
      "and",
      e.op(dc.dataset.uri, "=", datasetUri)
    ),
  }));

export const selectDatasetIdByDatasetUri = (datasetUri: string) =>
  e
    .select(e.dataset.Dataset, (d) => ({
      id: true,
      filter: e.op(d.uri, "=", datasetUri),
    }))
    .assert_single();
/**
 * Linking a node with another node
 */
export const linkDatasetWithDatasetCase = ({
  datasetCaseUUID,
  datasetUri,
}: {
  datasetCaseUUID: string;
  datasetUri: string;
}) =>
  e.update(e.dataset.Dataset, (d) => ({
    filter_single: e.op(d.uri, "=", datasetUri),
    set: {
      cases: {
        "+=": e.select(e.dataset.DatasetCase, (dc) => ({
          filter_single: e.op(dc.id, "=", e.uuid(datasetCaseUUID)),
        })),
      },
    },
  }));

export const linkNewArtifactWithDatasetSpecimen = (
  datasetSpecimenUUID: string,
  insertArtifactQuery: any
) =>
  e.update(e.dataset.DatasetSpecimen, (ds) => ({
    filter_single: e.op(ds.id, "=", e.uuid(datasetSpecimenUUID)),
    set: {
      artifacts: { "+=": insertArtifactQuery },
    },
  }));

export const linkDatasetPatientWithDatasetSpecimen = ({
  datasetPatientUUID,
  datasetSpecimenUUID,
}: {
  datasetPatientUUID: string;
  datasetSpecimenUUID: string;
}) =>
  e.update(e.dataset.DatasetPatient, (dp) => ({
    filter_single: e.op(dp.id, "=", e.uuid(datasetPatientUUID)),
    set: {
      specimens: {
        "+=": e.select(e.dataset.DatasetSpecimen, (ds) => ({
          filter_single: e.op(ds.id, "=", e.uuid(datasetSpecimenUUID)),
        })),
      },
    },
  }));

export const linkDatasetCaseWithDatasetPatient = ({
  datasetPatientUUID,
  datasetCaseUUID,
}: {
  datasetPatientUUID: string;
  datasetCaseUUID: string;
}) =>
  e.update(e.dataset.DatasetCase, (dc) => ({
    filter_single: e.op(dc.id, "=", e.uuid(datasetCaseUUID)),
    set: {
      patients: {
        "+=": e.select(e.dataset.DatasetPatient, (dp) => ({
          filter_single: e.op(dp.id, "=", e.uuid(datasetPatientUUID)),
        })),
      },
    },
  }));

/**
 * Insertion queries
 */
export const insertNewDatasetCase = ({
  datasetPatientUUID,
  exId,
}: {
  datasetPatientUUID: string;
  exId: string;
}) =>
  e.insert(e.dataset.DatasetCase, {
    externalIdentifiers: makeSystemlessIdentifierArray(exId),
    patients: e.select(e.dataset.DatasetPatient, (dp) => ({
      filter_single: e.op(dp.id, "=", e.uuid(datasetPatientUUID)),
    })),
  });

export const insertNewDatasetSpecimen = ({
  exId,
  insertArtifactQuery,
}: {
  exId: string;
  insertArtifactQuery: any;
}) =>
  e.insert(e.dataset.DatasetSpecimen, {
    externalIdentifiers: makeSystemlessIdentifierArray(exId),
    artifacts: insertArtifactQuery,
  });

export const insertNewDatasetPatient = ({
  sexAtBirth,
  exId,
  datasetSpecimenUUID,
}: {
  sexAtBirth: "male" | "female" | null;
  exId: string;
  datasetSpecimenUUID: string;
}) =>
  e.insert(e.dataset.DatasetPatient, {
    sexAtBirth: sexAtBirth,
    externalIdentifiers: makeSystemlessIdentifierArray(exId),
    specimens: e.select(e.dataset.DatasetSpecimen, (ds) => ({
      filter_single: e.op(ds.id, "=", e.uuid(datasetSpecimenUUID)),
    })),
  });
