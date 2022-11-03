import e, { pedigree } from "../../../dbschema/edgeql-js";
import { selectDatasetPatientByExternalIdentifiersQuery } from "./dataset-queries";
import { makeSystemlessIdentifierArray } from "./helper";

export const selectPedigreeByDatasetCaseIdQuery = (datasetCaseId: string) => {
  return e.select(e.pedigree.Pedigree, (p: { case_: any }) => ({
    id: true,
    filter: e.op(
      p.case_.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(datasetCaseId)
    ),
  }));
};

export const insertPedigreeByDatasetCaseIdQuery = (datasetCaseId: string) => {
  const insertNewPedigree = e.insert(e.pedigree.Pedigree, {});

  return e.update(e.dataset.DatasetCase, (dc) => ({
    filter: e.op(
      dc.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(datasetCaseId)
    ),
    set: {
      pedigree: insertNewPedigree,
    },
  }));
};

export const updatePedigreeProbandAndDatasetPatientQuery = ({
  pedigreeUUID,
  probandId,
}: {
  pedigreeUUID: string;
  probandId: string;
}) => {
  const findDPFromExternalId =
    selectDatasetPatientByExternalIdentifiersQuery(probandId);

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
}: {
  pedigreeUUID: string;
  probandId: string;
  paternalId: string;
}) => {
  return e.update(e.pedigree.Pedigree, (p) => ({
    filter: e.op(p.id, "=", e.uuid(pedigreeUUID)),
    set: {
      relationships: {
        "+=": e.insert(e.pedigree.PedigreeRelationship, {
          individual:
            selectDatasetPatientByExternalIdentifiersQuery(
              paternalId
            ).assert_single(),
          relation: pedigree.KinType.isBiologicalFatherOf,
          relative:
            selectDatasetPatientByExternalIdentifiersQuery(
              probandId
            ).assert_single(),
        }),
      },
    },
  }));
};

export const updatePedigreeMaternalRelationshipQuery = ({
  pedigreeUUID,
  probandId,
  maternalId,
}: {
  pedigreeUUID: string;
  probandId: string;
  maternalId: string;
}) => {
  return e.update(e.pedigree.Pedigree, (p) => ({
    filter: e.op(p.id, "=", e.uuid(pedigreeUUID)),
    set: {
      relationships: {
        "+=": e.insert(e.pedigree.PedigreeRelationship, {
          individual:
            selectDatasetPatientByExternalIdentifiersQuery(
              maternalId
            ).assert_single(),
          relation: pedigree.KinType.isBiologicalMotherOf,
          relative:
            selectDatasetPatientByExternalIdentifiersQuery(
              probandId
            ).assert_single(),
        }),
      },
    },
  }));
};
