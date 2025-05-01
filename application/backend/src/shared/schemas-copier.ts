import { Static, Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const CopyInvokeEntry = Type.Object({
  bytes_transferred: Type.Integer(),
  copy_mode: Type.String(),
  source: Type.String(),
  destination: Type.String(),
  elapsed_seconds: Type.Number(),
  n_retries: Type.Optional(Type.String()),
  reason: Type.Optional(
    Type.Object({
      kind: Type.String(),
      value: Type.String(),
    }),
  ),
});

export type CopyInvokeEntryType = Static<typeof CopyInvokeEntry>;
