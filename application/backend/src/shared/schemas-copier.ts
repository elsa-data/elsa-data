import { type Static, Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const CopyInvokeEntry = Type.Object({
  bytesTransferred: Type.Integer(),
  copyMode: Type.String(),
  source: Type.String(),
  destination: Type.String(),
  elapsedSeconds: Type.Number(),
});

export type CopyInvokeEntryType = Static<typeof CopyInvokeEntry>;
