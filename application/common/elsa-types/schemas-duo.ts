import { Static, Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

/**
 * We manually codify the DUO code system to also include the *data* structures / information model
 * that is needed to make sense of the codes (i.e. GS needs somewhere to put the list of country codes)
 */

const KnownModifierCodes = [
  "DUO:0000019",
  "DUO:0000020",
  "DUO:0000046",
  "DUO:0000018",
  "DUO:0000045",
  "DUO:0000024",
  "DUO:0000016",
  "DUO:0000025",
  "DUO:0000029",
  "DUO:0000043",
  "DUO:0000015",
  "DUO:0000022",
  "DUO:0000026",
  "DUO:0000006",
  "DUO:0000028",
  "DUO:0000027",
] as const;

const KnownLimitationCodes = [
  "DUO:0000042",
  "DUO:0000006",
  "DUO:0000007",
  "DUO:0000011",
  "DUO:0000004",
] as const;

const KnownDuoCodes = [...KnownModifierCodes, ...KnownLimitationCodes] as const;

export type KnownModifierCode = typeof KnownModifierCodes[number];

export type KnownLimitationCode = typeof KnownLimitationCodes[number];

export type KnownDuoCode = typeof KnownDuoCodes[number];

export const DuoPublicationRequiredSchema = Type.Object({
  code: Type.Literal("DUO:0000019"), // PUB
});

export const DuoNonCommercialUseOnlySchema = Type.Object({
  code: Type.Literal("DUO:0000046"), // NCU
});

export const DuoNotForProfitNonCommercialUseOnlySchema = Type.Object({
  code: Type.Literal("DUO:0000018"), // NPUNCU   NotForProfitNonCommercialUseOnlyCode
});

export const DuoCollaborationRequiredSchema = Type.Object({
  code: Type.Literal("DUO:0000020"), // COL
});

export const DuoGeographicalRestrictionSchema = Type.Object({
  code: Type.Literal("DUO:0000022"), //  GS GeographicalRestrictionCode
  regions: Type.Array(Type.String()),
});

export const DuoNotForProfitUseOnlySchema = Type.Object({
  code: Type.Literal("DUO:0000045"), // NPU  NotForProfitUseOnlyCode
});

export type DuoGeographicalRestrictionType = Static<
  typeof DuoGeographicalRestrictionSchema
>;
export type DuoNonCommercialUseOnlyType = Static<
  typeof DuoNonCommercialUseOnlySchema
>;
export type DuoNotForProfitNonCommercialUseOnlyType = Static<
  typeof DuoNotForProfitNonCommercialUseOnlySchema
>;
export type DuoNotForProfitUseOnlyType = Static<
  typeof DuoNotForProfitUseOnlySchema
>;
export type DuoPublicationRequiredType = Static<
  typeof DuoPublicationRequiredSchema
>;
export type DuoCollaborationRequiredType = Static<
  typeof DuoCollaborationRequiredSchema
>;

export const DuoModifierSchema = Type.Union(
  [
    DuoPublicationRequiredSchema,
    DuoCollaborationRequiredSchema,
    DuoNonCommercialUseOnlySchema,
    DuoNotForProfitNonCommercialUseOnlySchema,
    DuoNotForProfitUseOnlySchema,
    Type.Object({
      code: Type.Literal("DUO:0000024"), // MOR  PublicationMoratoriumCode
    }),
    Type.Object({
      code: Type.Literal("DUO:0000016"), // GSO  GeneticStudiesOnlyCode
    }),
    Type.Object({
      code: Type.Literal("DUO:0000025"), // TS
      start: Type.Optional(Type.RegEx(/^\d{4}-(0\d|1[0-2])-([0-2]\d|3[01])$/)),
      end: Type.Optional(Type.RegEx(/^\d{4}-(0\d|1[0-2])-([0-2]\d|3[01])$/)),
    }),
    Type.Object({
      code: Type.Literal("DUO:0000029"), //  RTN  ReturnToDatabaseCode
    }),
    Type.Object({
      code: Type.Literal("DUO:0000043"), //  CC ClinicalCareUseCode
    }),
    Type.Object({
      code: Type.Literal("DUO:0000015"), //  NMDS  NoGeneralMethodsCode
    }),
    DuoGeographicalRestrictionSchema,
    Type.Object({
      code: Type.Literal("DUO:0000026"), //   US  SpecificUserCode
      users: Type.Array(Type.String()),
    }),
    Type.Object({
      code: Type.Literal("DUO:0000006"), //   RS  SpecificResearcherTypeCode
      types: Type.Array(Type.String()),
    }),
    Type.Object({
      code: Type.Literal("DUO:0000028"), //  IS   SpecificInstitutionCode
      institutions: Type.Array(Type.String()),
    }),
    Type.Object({
      code: Type.Literal("DUO:0000027"), //  PS  SpecificProjectCode
      projects: Type.Array(Type.String()),
    }),
  ],
  // this doesn't seem to be working - I can't use a Type.Ref to this anyhow
  {
    $id: "DuoModifier",
  }
);

// we should get $ref working so that the definition of the array of modifiers is only declared once
// export const ModifierArrayReference = Type.Array(Type.Ref(DuoModifierSchema));

export const DuoGeneralResearchUseSchema = Type.Object({
  code: Type.Literal("DUO:0000042"), // GRU
  modifiers: Type.Array(DuoModifierSchema),
});

export const DuoHealthMedicalBiomedicalResearchSchema = Type.Object({
  code: Type.Literal("DUO:0000006"), // HMB
  modifiers: Type.Array(Type.Ref(DuoModifierSchema)),
});

export const DuoDiseaseSpecificResearchSchema = Type.Object({
  code: Type.Literal("DUO:0000007"), // DS
  diseaseSystem: Type.String(),
  diseaseCode: Type.String(),
  modifiers: Type.Array(Type.Ref(DuoModifierSchema)),
});

export const DuoPopulationAncestryResearchOnlySchema = Type.Object({
  code: Type.Literal("DUO:0000011"), // POA
  modifiers: Type.Array(Type.Ref(DuoModifierSchema)),
});

export const DuoNoRestrictionSchema = Type.Object({
  code: Type.Literal("DUO:0000004"), // NRES
  modifiers: Type.Array(Type.Ref(DuoModifierSchema)),
});

export const DuoFreeTextSchema = Type.Object({
  description: Type.String(),
});

export const DuoLimitationSchema = Type.Union([
  DuoGeneralResearchUseSchema,
  DuoHealthMedicalBiomedicalResearchSchema,
  DuoDiseaseSpecificResearchSchema,
  DuoPopulationAncestryResearchOnlySchema,
  DuoNoRestrictionSchema,
  DuoFreeTextSchema,
]);

export const DuoLimitationCodedSchema = Type.Union([
  DuoGeneralResearchUseSchema,
  DuoHealthMedicalBiomedicalResearchSchema,
  DuoDiseaseSpecificResearchSchema,
]);

export type DuoLimitationCodedType = Static<typeof DuoLimitationCodedSchema>;

export type DuoGeneralResearchUseType = Static<
  typeof DuoGeneralResearchUseSchema
>;
export type DuoHealthMedicalBiomedicalResearchType = Static<
  typeof DuoHealthMedicalBiomedicalResearchSchema
>;
export type DuoDiseaseSpecificResearchType = Static<
  typeof DuoDiseaseSpecificResearchSchema
>;
export type DuoPopulationAncestryResearchOnlyType = Static<
  typeof DuoPopulationAncestryResearchOnlySchema
>;
export type DuoNoRestrictionType = Static<typeof DuoNoRestrictionSchema>;

// for completeness, we include a DUO data use limitation that allows freetext - but for practical
// computation we essentially never want these
export type DuoLimitationType = Static<typeof DuoLimitationSchema>;

export type DuoModifierType = Static<typeof DuoModifierSchema>;
