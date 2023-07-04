import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASE,
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
} from "@umccr/elsa-constants";
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Set a cookie for use in a frontend UI.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
export function cookieForUI(
  request: FastifyRequest,
  reply: FastifyReply,
  k: string,
  v: string
) {
  return reply.setCookie(k, v, {
    path: "/",
    secure: true,
    httpOnly: false,
    maxAge: 24 * 60 * 60, // 1 day (in seconds)
  });
}

/**
 * Set a cookie for use in a backend.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
export function cookieForBackend(
  request: FastifyRequest,
  reply: FastifyReply,
  k: string,
  v: any
) {
  request.session.options({
    maxAge: 24 * 60 * 60, // 1 day (in seconds); Documented in  in "SECURITY.md" please update accordingly.
  });
  request.session.set(k, v);
}

/**
 * It will return a string of allowed permissions for UI cookie.
 *
 * NOTE: this is a UI cookie - the actual enforcement of this grouping at an API layer is elsewhere
 * we do it this way so that we can centralise all permissions logic on the backend, and hand down
 * simple "is allowed" decisions to the UI
 * MAKE SURE ALL THE DECISIONS HERE MATCH THE API AUTH LOGIC - THAT IS THE POINT OF THIS TECHNIQUE
 *
 * @param isSuperAdmin the config based super admin permission
 * @param props user permissions
 * @returns
 */
export function createUserAllowedCookie(
  isSuperAdmin: boolean,
  {
    isAllowedCreateRelease,
    isAllowedRefreshDatasetIndex,
    isAllowedOverallAdministratorView,
  }: {
    isAllowedCreateRelease: boolean;
    isAllowedRefreshDatasetIndex: boolean;
    isAllowedOverallAdministratorView: boolean;
  } & Record<string, any>
): string {
  const allowed = new Set<string>();

  if (isAllowedCreateRelease) {
    allowed.add(ALLOWED_CREATE_NEW_RELEASE);
  }

  if (isAllowedRefreshDatasetIndex) {
    allowed.add(ALLOWED_DATASET_UPDATE);
  }

  if (isAllowedOverallAdministratorView) {
    allowed.add(ALLOWED_OVERALL_ADMIN_VIEW);
  }

  // this is a special case - when someone is a super admin - this is
  // all the permissions that they should get
  // these permissions MUST NOT overlap with permissions that get assigned by the database
  if (isSuperAdmin) {
    allowed.add(ALLOWED_CHANGE_USER_PERMISSION);
  }

  return Array.from(allowed.values()).join(",");
}
