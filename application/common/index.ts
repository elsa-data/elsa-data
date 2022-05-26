import { Static } from "@sinclair/typebox";
import { ReleaseSchema } from "./schemas";
import {
  DuoLimitationCodedSchema,
  DuoLimitationSchema,
  DuoModifierSchema,
} from "./schemas-duo";
import { ApplicationCodedSchemaV1 } from "./schemas-application-coded";

export * from "./schemas";
export * from "./schemas-duo";

export type ReleaseType = Static<typeof ReleaseSchema>;

export type DuoLimitationCodedType = Static<typeof DuoLimitationCodedSchema>;

// for completeness, we include a DUO data use limitation that allows freetext - but for practical
// computation we essentially never want these
export type DuoLimitationType = Static<typeof DuoLimitationSchema>;

export type DuoModifierType = Static<typeof DuoModifierSchema>;

export type ApplicationCodedTypeV1 = Static<typeof ApplicationCodedSchemaV1>;
