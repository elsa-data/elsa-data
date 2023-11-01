import e from "../../../dbschema/edgeql-js";
import { selectDatasetPatientByExternalIdAndDatasetUriQuery } from "./dataset-queries";
import { makeSystemlessIdentifierArray } from "./helper";

export const selectPedigreeByDatasetCaseIdAndDatasetUri = ({
  datasetCaseId,
  datasetUri,
}: {
  datasetCaseId: string;
  datasetUri: string;
}) => {
  return e.select(e.pedigree.Pedigree, (p: { case_: any }) => ({
    id: true,
    filter_single: e.op(
      e.op(
        p.case_.externalIdentifiers,
        "=",
        makeSystemlessIdentifierArray(datasetCaseId),
      ),
      "and",
      e.op(p.case_.dataset.uri, "=", datasetUri),
    ),
  }));
};

export const linkPedigreeWithDatasetCase = ({
  datasetCaseId,
  datasetUri,
  pedigreeUUID,
}: {
  datasetCaseId: string;
  datasetUri: string;
  pedigreeUUID: string;
}) => {
  return e.update(e.dataset.DatasetCase, (dc) => ({
    filter_single: e.op(
      e.op(
        dc.externalIdentifiers,
        "=",
        makeSystemlessIdentifierArray(datasetCaseId),
      ),
      "and",
      e.op(dc.dataset.uri, "=", datasetUri),
    ),
    set: {
      pedigree: e.select(e.pedigree.Pedigree, (p) => ({
        filter_single: e.op(p.id, "=", e.uuid(pedigreeUUID)),
      })),
    },
  }));
};

export const updatePedigreeProbandAndDatasetPatientQuery = ({
  datasetUri,
  pedigreeUUID,
  probandId,
}: {
  datasetUri: string;
  pedigreeUUID: string;
  probandId: string;
}) => {
  const findDPFromExternalId =
    selectDatasetPatientByExternalIdAndDatasetUriQuery({
      exId: probandId,
      datasetUri,
    });

  return e.update(e.pedigree.Pedigree, (p) => ({
    filter: e.op(p.id, "=", e.uuid(pedigreeUUID)),
    set: {
      proband: findDPFromExternalId.assert_single(),
    },
  }));
};

export const updatePedigreePaternalRelationshipQuery = ({
  pedigreeUUID,
  probandId,
  paternalId,
  datasetUri,
}: {
  datasetUri: string;
  pedigreeUUID: string;
  probandId: string;
  paternalId: string;
}) => {
  return e.update(e.pedigree.Pedigree, (p) => ({
    filter: e.op(p.id, "=", e.uuid(pedigreeUUID)),
    set: {
      relationships: {
        "+=": e.insert(e.pedigree.PedigreeRelationship, {
          individual: selectDatasetPatientByExternalIdAndDatasetUriQuery({
            exId: paternalId,
            datasetUri,
          }).assert_single(),
          relation: "isBiologicalFatherOf",
          relative: selectDatasetPatientByExternalIdAndDatasetUriQuery({
            datasetUri,
            exId: probandId,
          }).assert_single(),
        }),
      },
    },
  }));
};

export const updatePedigreeMaternalRelationshipQuery = ({
  pedigreeUUID,
  probandId,
  maternalId,
  datasetUri,
}: {
  pedigreeUUID: string;
  probandId: string;
  maternalId: string;
  datasetUri: string;
}) => {
  return e.update(e.pedigree.Pedigree, (p) => ({
    filter: e.op(p.id, "=", e.uuid(pedigreeUUID)),
    set: {
      relationships: {
        "+=": e.insert(e.pedigree.PedigreeRelationship, {
          individual: selectDatasetPatientByExternalIdAndDatasetUriQuery({
            datasetUri,
            exId: maternalId,
          }).assert_single(),
          relation: "isBiologicalMotherOf",
          relative: selectDatasetPatientByExternalIdAndDatasetUriQuery({
            datasetUri,
            exId: probandId,
          }).assert_single(),
        }),
      },
    },
  }));
};
