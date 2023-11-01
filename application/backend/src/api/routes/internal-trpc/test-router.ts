import { router, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";

/**
 * TRPC router that can exhibit a variety of test error/good results.

 * Used exclusively for integration testing.
 */
export const testRouter = router({
  // a TRPC route that successfully does almost nothing
  // allows us to test out passing in various values and some return values
  // otherwise is doing nothing other checking the basic plumbing of the routes is correct (auth etc)
  succeed: internalProcedure
    .input(
      z.object({
        aString: z.string(),
        aNumber: z.number(),
        aOptionalString: z.optional(z.string()),
        aOptionalNumber: z.optional(z.number()),
        aArrayOfString: z.array(z.string()),
      }),
    )
    .query(async ({ input, ctx }) => {
      // test our ctx is correctly populated
      ctx.logger.info("Reached the start of the testRouter succeed call");
      return {
        didStringHaveLetterA: input.aString.includes("A"),
        doubledNumber: input.aNumber * 2,
        arrayLength: input.aArrayOfString.length,
      };
    }),
  failWithInternalError: internalProcedure.query(async ({ input, ctx }) => {
    // @ts-ignore
    const val = undefined.something;
  }),
});
