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

/**
 * A Zod objects for pagination properties
 *
 * NOTE:  use .merge() to combine with other objects
 *        e.g. inputPaginationParameter.merge(inputReleaseKeySingleParameter)
 */
export const inputPaginationParameter = z
  .object({
    page: z.number().positive(),
    orderByProperty: z.string(),
    orderAscending: z.boolean(),
  })
  .partial();
