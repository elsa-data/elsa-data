import Type from "typebox";
import {
  DuoApplicationSchema,
  DuoCollaborationRequiredSchema,
  DuoDiseaseSpecificResearchSchema,
  DuoGeneralResearchUseSchema,
  DuoGeographicalRestrictionSchema,
  DuoHealthMedicalBiomedicalResearchSchema,
  DuoLimitationCodedSchema,
  DuoLimitationCodeSchema,
  DuoLimitationSchema,
  DuoModifierSchema,
  DuoNonCommercialUseOnlySchema,
  DuoNoRestrictionSchema,
  DuoNotForProfitNonCommercialUseOnlySchema,
  DuoNotForProfitUseOnlySchema,
  DuoPopulationAncestryResearchOnlySchema,
  DuoPublicationRequiredSchema,
} from "./duo-schemas.ts";

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

export type KnownModifierCode = (typeof KnownModifierCodes)[number];

export type KnownLimitationCode = (typeof KnownLimitationCodes)[number];

export type KnownDuoCode = (typeof KnownDuoCodes)[number];

export type DuoGeographicalRestrictionType = Type.Static<
  typeof DuoGeographicalRestrictionSchema
>;
export type DuoNonCommercialUseOnlyType = Type.Static<
  typeof DuoNonCommercialUseOnlySchema
>;
export type DuoNotForProfitNonCommercialUseOnlyType = Type.Static<
  typeof DuoNotForProfitNonCommercialUseOnlySchema
>;
export type DuoNotForProfitUseOnlyType = Type.Static<
  typeof DuoNotForProfitUseOnlySchema
>;
export type DuoPublicationRequiredType = Type.Static<
  typeof DuoPublicationRequiredSchema
>;
export type DuoCollaborationRequiredType = Type.Static<
  typeof DuoCollaborationRequiredSchema
>;

export type DuoLimitationCodedType = Type.Static<
  typeof DuoLimitationCodedSchema
>;

export type DuoGeneralResearchUseType = Type.Static<
  typeof DuoGeneralResearchUseSchema
>;
export type DuoHealthMedicalBiomedicalResearchType = Type.Static<
  typeof DuoHealthMedicalBiomedicalResearchSchema
>;
export type DuoDiseaseSpecificResearchType = Type.Static<
  typeof DuoDiseaseSpecificResearchSchema
>;
export type DuoPopulationAncestryResearchOnlyType = Type.Static<
  typeof DuoPopulationAncestryResearchOnlySchema
>;
export type DuoNoRestrictionType = Type.Static<typeof DuoNoRestrictionSchema>;

// for completeness, we include a DUO data use limitation that allows freetext - but for practical
// computation we essentially never want these
export type DuoLimitationType = Type.Static<typeof DuoLimitationSchema>;

export type DuoLimitationCodeType = Type.Static<typeof DuoLimitationCodeSchema>;

export type DuoModifierType = Type.Static<typeof DuoModifierSchema>;

export type DuoApplicationType = Type.Static<typeof DuoApplicationSchema>;
