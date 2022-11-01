import e, { pedigree } from "../../../dbschema/edgeql-js";
import { selectDatasetPatientByExternalIdentifiersQuery } from "./dataset-queries";
import { makeSystemlessIdentifierArray } from "./helper";

export const selectPedigreeByDatasetCaseIdQuery = e.params(
  { datasetCaseId: e.str },
  (params: any) =>
    e.select(e.pedigree.Pedigree, (p: { case_: any }) => ({
      id: true,
      filter: e.op(
        p.case_.externalIdentifiers,
        "=",
        makeSystemlessIdentifierArray(params.datasetCaseId)
      ),
    }))
);

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
      proband: findDPFromExternalId,
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
            selectDatasetPatientByExternalIdentifiersQuery(paternalId),
          relation: pedigree.KinType.isBiologicalFather,
          relative: selectDatasetPatientByExternalIdentifiersQuery(probandId),
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
            selectDatasetPatientByExternalIdentifiersQuery(maternalId),
          relation: pedigree.KinType.isBiologicalFather,
          relative: selectDatasetPatientByExternalIdentifiersQuery(probandId),
        }),
      },
    },
  }));
};
