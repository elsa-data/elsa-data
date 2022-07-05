import { Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const CodingSchema = Type.Object({
  // a mandatory system URI or the empty string to indicate no system
  system: Type.String(),

  // I'd like to not have to deal with versioned codes if possible
  // version: Type.Optional(Type.String()),

  // a mandatory non-empty string
  code: Type.String(),

  // an optional slot for storing a display string - though in general this should not be persisted
  display: Type.Optional(Type.String()),

  // not sure needed for us
  // userSelected: Type.Optional(Type.Boolean())
});
