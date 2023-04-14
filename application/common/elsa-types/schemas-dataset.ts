import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";
import { ReleasePatientBirthSexSchema } from "./schemas-releases";
/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const ArtifactSchema = Type.Object({
  location: Type.String(),
  size: Type.Number(),
  type: Type.String(),
  md5: Type.Optional(Type.String()),
});

export const DatasetSpecimenSchema = Type.Object({
  artifacts: Type.Array(ArtifactSchema),
});

export const DatasetPatientSchema = Type.Object({
  // specimens: Type.Array(DatasetSpecimenSchema),
  externalIdentifiers: Type.Union([
    Type.Optional(
      Type.Array(
        Type.Object({
          system: Type.String(),
          value: Type.String(),
        })
      )
    ),
    Type.Null(),
  ]),
  sexAtBirth: Type.Union([ReleasePatientBirthSexSchema, Type.Null()]),
  consent: Type.Union([Type.Object({ id: Type.String() }), Type.Null()]),
});

export const DatasetCaseSchema = Type.Object({
  consent: Type.Union([Type.Object({ id: Type.String() }), Type.Null()]),
  externalIdentifiers: Type.Union([
    Type.Optional(
      Type.Array(
        Type.Object({
          system: Type.String(),
          value: Type.String(),
        })
      )
    ),
    Type.Null(),
  ]),
  patients: Type.Array(DatasetPatientSchema),
});

export const DatasetSchemaLight = Type.Object({
  uri: Type.String(),
  description: Type.String(),
  updatedDateTime: TypeDate,
  isInConfig: Type.Boolean(),
  totalCaseCount: Type.Number(),
  totalPatientCount: Type.Number(),
  totalSpecimenCount: Type.Number(),
  totalArtifactCount: Type.Number(),
  totalArtifactIncludes: Type.String(),
  totalArtifactSizeBytes: Type.Number(),
});

export const DatasetArtifactCount = Type.Object({
  bclCount: Type.Number(),
  fastqCount: Type.Number(),
  vcfCount: Type.Number(),
  bamCount: Type.Number(),
  cramCount: Type.Number(),
});

export const DatasetSchemaNesting = Type.Object({
  cases: Type.Array(DatasetCaseSchema),
});

export const DatasetSchemaDeep = Type.Intersect([
  DatasetSchemaLight,
  DatasetSchemaNesting,
  DatasetArtifactCount,
]);

export type DatasetLightType = Static<typeof DatasetSchemaLight>;
export type DatasetDeepType = Static<typeof DatasetSchemaDeep>;
export type DatasetCaseType = Static<typeof DatasetCaseSchema>;
