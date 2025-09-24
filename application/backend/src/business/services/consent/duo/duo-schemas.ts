import Type from "typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

/**
 * We manually codify the DUO code system to also include the *data* structures / information model
 * that is needed to make sense of the codes (e.g. GS needs somewhere to put the list of country codes)
 */

export const DUO_PUB = "DUO:0000019";
export const DuoPublicationRequiredSchema = Type.Object({
  code: Type.Literal(DUO_PUB), // PUB
});

export const DUO_NCU = "DUO:0000046";
export const DuoNonCommercialUseOnlySchema = Type.Object({
  code: Type.Literal(DUO_NCU), // NCU
});

export const DUO_NPUNCU = "DUO:0000018";
export const DuoNotForProfitNonCommercialUseOnlySchema = Type.Object({
  code: Type.Literal(DUO_NPUNCU), // NPUNCU   NotForProfitNonCommercialUseOnlyCode
});

export const DUO_COL = "DUO:0000020";
export const DuoCollaborationRequiredSchema = Type.Object({
  code: Type.Literal(DUO_COL), // COL
});

export const DUO_GS = "DUO:0000022";
export const DuoGeographicalRestrictionSchema = Type.Object({
  code: Type.Literal(DUO_GS), //  GS GeographicalRestrictionCode
  regions: Type.Array(Type.String()),
});

export const DUO_NPU = "DUO:0000045";
export const DuoNotForProfitUseOnlySchema = Type.Object({
  code: Type.Literal(DUO_NPU), // NPU  NotForProfitUseOnlyCode
});

export const DUO_TS = "DUO:0000025";
export const DuoTimeSpecificSchema = Type.Object({
  code: Type.Literal(DUO_TS), // TS
  start: Type.Optional(
    Type.String({ pattern: /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[01])$/ }),
  ),
  end: Type.Optional(
    Type.String({ pattern: /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[01])$/ }),
  ),
});

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
    DuoTimeSpecificSchema,
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
  //{
  //  $id: "DuoModifier",
  //},
);

// we should get $ref working so that the definition of the array of modifiers is only declared once
// export const ModifierArrayReference = Type.Array(Type.Ref(DuoModifierSchema));

/**
 * General Research Use Limitation
 */
export const DUO_GRU = "DUO:0000042"; // GRU
export const DuoGeneralResearchUseSchema = Type.Object({
  code: Type.Literal(DUO_GRU), // GRU
  modifiers: Type.Optional(Type.Array(DuoModifierSchema)),
});

/**
 * Health / Medical / Biomedical Research Limitation
 */
export const DUO_HMB = "DUO:0000006";
export const DuoHealthMedicalBiomedicalResearchSchema = Type.Object({
  code: Type.Literal(DUO_HMB), // HMB
  modifiers: Type.Optional(Type.Array(DuoModifierSchema)),
});

/**
 * Disease Specific Limitation
 */
export const DUO_DS = "DUO:0000007";
export const DuoDiseaseSpecificResearchSchema = Type.Object({
  code: Type.Literal(DUO_DS), // DS
  diseaseSystem: Type.String(),
  diseaseCode: Type.String(),
  modifiers: Type.Optional(Type.Array(DuoModifierSchema)),
});

/**
 * Population Ancestry Research Only Limitation
 */
export const DUO_POA = "DUO:0000011";
export const DuoPopulationAncestryResearchOnlySchema = Type.Object({
  code: Type.Literal(DUO_POA), // POA
  modifiers: Type.Optional(Type.Array(DuoModifierSchema)),
});

export const DUO_NRES = "DUO:0000004";
export const DuoNoRestrictionSchema = Type.Object({
  code: Type.Literal(DUO_NRES), // NRES
  modifiers: Type.Optional(Type.Array(DuoModifierSchema)),
});

export const DuoFreeTextSchema = Type.Object({
  description: Type.String(),
});

/**
 * DUO Limitation is the base statement of consent. This schema includes all limitations including
 * free text limitations.
 */
export const DuoLimitationSchema = Type.Union([
  DuoGeneralResearchUseSchema,
  DuoHealthMedicalBiomedicalResearchSchema,
  DuoDiseaseSpecificResearchSchema,
  DuoPopulationAncestryResearchOnlySchema,
  DuoNoRestrictionSchema,
  DuoFreeTextSchema,
]);

/**
 * If someone wants to apply using a code - but no accompanying data.
 */
export const DuoLimitationCodeSchema = Type.Union([
  Type.Literal(DUO_GRU),
  Type.Literal(DUO_HMB),
  Type.Literal(DUO_DS),
  Type.Literal(DUO_POA),
  Type.Literal(DUO_NRES),
]);

/**
 * DUO Limitation Coded is an alternate base statement of consent. It omits freetext limitations therefore
 * restricting to consent statements that are computable.
 */
export const DuoLimitationCodedSchema = Type.Union([
  DuoGeneralResearchUseSchema,
  DuoHealthMedicalBiomedicalResearchSchema,
  DuoDiseaseSpecificResearchSchema,
  DuoPopulationAncestryResearchOnlySchema,
  DuoNoRestrictionSchema,
]);

export const DuoApplicationSchema = Type.Object({
  // not including a research type will rule out all data other than "no restriction" data
  researchType: Type.Optional(DuoLimitationCodeSchema),

  researchers: Type.Optional(Type.Array(Type.String())),
  institutions: Type.Optional(Type.Array(Type.String())),
  countries: Type.Optional(Type.Array(Type.String())),

  disease: Type.Optional(Type.String()),
  // projects
});
