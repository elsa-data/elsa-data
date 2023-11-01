import { z } from "zod";

/**
 * A schema for allowing settings that influence the behaviour of the RBAC
 * system. For instance, depending on your security posture - you may want to allow
 * admins to download objects (same as researchers), or not. Any settings for
 * decision points like this belong here.
 */
export const PermissionSchema = z.object({
  releaseAdministratorsCanAlsoAccessData: z
    .optional(z.boolean())
    .describe(
      "If present and true, release administrators will also be able to use the access mechanisms for sharing (as opposed to just being able to 'set' the sharers)",
    ),
});

export type PermissionType = z.infer<typeof PermissionSchema>;
