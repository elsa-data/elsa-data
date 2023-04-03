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
  v?: string
) {
  if (v === undefined) {
    return;
  }

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
    maxAge: 24 * 60 * 60, // 1 day (in seconds)
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
 * @param  props user permissions
 * @returns
 */
export function createUserAllowedCookie({
  isAllowedCreateRelease,
  isAllowedRefreshDatasetIndex,
  isAllowedOverallAdministratorView,
  isAllowedChangeUserPermission,
}: {
  isAllowedCreateRelease: boolean;
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedOverallAdministratorView: boolean;
  isAllowedChangeUserPermission: boolean;
} & Record<string, any>): string {
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

  if (isAllowedChangeUserPermission) {
    allowed.add(ALLOWED_CHANGE_USER_PERMISSION);
  }

  return Array.from(allowed.values()).join(",");
}
