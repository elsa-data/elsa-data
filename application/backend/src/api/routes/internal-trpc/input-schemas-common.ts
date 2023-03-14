import { z } from "zod";

/**
 * Any Zod rules on our release keys.
 */
export const inputReleaseKey = z.string();

/**
 * A Zod object for any call that just involves specifying the releaseKey
 */
export const inputReleaseKeySingleParameter = z.object({
  releaseKey: inputReleaseKey,
});
