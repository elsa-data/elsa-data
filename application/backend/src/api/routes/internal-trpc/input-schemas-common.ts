import { z } from "zod";

/**
 * Any Zod rules on our release keys.
 */
export const inputReleaseKey = z.string();

/**
 * A Zod object for any call that just involves specifying the releaseKey
 */
export const inputReleaseKeySingle = z.object({
  releaseKey: inputReleaseKey,
});

export const unorderedInputPaginationParameter = z.object({
  page: z.number().positive().default(1),
});

/**
 * A Zod objects for pagination properties
 *
 * NOTE:  use .merge() to combine with other objects
 *        e.g. inputPaginationParameter.merge(inputReleaseKeySingleParameter)
 */
export const inputPaginationParameter = z.object({
  page: z.number().positive().default(1),
  orderByProperty: z.string().default("occurredDateTime"),
  orderAscending: z.boolean().default(false),
});
