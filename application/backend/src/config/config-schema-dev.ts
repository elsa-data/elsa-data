import { z } from "zod";

export const DevTestingSchema = z.optional(
  z
    .object({
      sourceFrontEndDirect: z
        .boolean()
        .default(true)
        .describe(
          "Whether to source the frontend build direct from the dev build location."
        ),
      allowTestUsers: z
        .boolean()
        .default(true)
        .describe(
          "If test users should be allowed, including various techniques used to adjust user sessions."
        ),
      allowTestRoutes: z
        .boolean()
        .default(true)
        .describe("If test routes should be added."),
      mockAwsCloud: z
        .boolean()
        .default(false)
        .describe(
          "If we should replace the AWS cloud clients with ones that always returns mock values."
        ),
      sendEmails: z
        .boolean()
        .default(false)
        .describe(
          "Whether emails should actually be sent or if they are just built and rendered locally."
        ),
    })
    .describe(
      "Sets the dev config options. Should only have an effect if `NODE_ENV=development` is also set."
    )
);

export type DevTestingType = z.infer<typeof DevTestingSchema>;
