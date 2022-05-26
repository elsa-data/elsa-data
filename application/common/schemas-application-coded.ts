import { Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const ApplicationGeneralResearchSchemaV1 = Type.Object({
  code: Type.Literal("GRU"),
});

export const ApplicationHealthMedicalBioResearchSchemaV1 = Type.Object({
  code: Type.Literal("HMB"),
});

export const ApplicationDiseaseResearchSchemaV1 = Type.Object({
  code: Type.Literal("DS"),
  diseases: Type.Array(Type.String()),
});

export const ApplicationClinicalCareSchemaV1 = Type.Object({
  code: Type.Literal("CC"),
});

/**
 * The application coded schema contains all coded details retrieved from the application
 * form, with any necessary computable clarifications. i.e. area of disease under study
 * coded in SNOMED as opposed to freetext.
 */
export const ApplicationCodedSchemaV1 = Type.Object({
  version: Type.Literal(1),

  researchType: Type.Union([
    ApplicationGeneralResearchSchemaV1,
    ApplicationHealthMedicalBioResearchSchemaV1,
    ApplicationDiseaseResearchSchemaV1,
    ApplicationClinicalCareSchemaV1,
  ]),

  researchersInvolved: Type.Array(Type.String()),
  institutesInvolved: Type.Array(Type.String()),
  countriesInvolved: Type.Array(Type.String()),

  studyStart: Type.Optional(Type.String()),
  studyEnd: Type.Optional(Type.String()),
});
