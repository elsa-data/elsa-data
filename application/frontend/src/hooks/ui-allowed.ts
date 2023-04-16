import { useCookies } from "react-cookie";
import { USER_ALLOWED_COOKIE_NAME } from "@umccr/elsa-constants";
import _ from "lodash";

/**
 * Find the set of functionality enabled for this logged-in user in the UI.
 */
export function useUiAllowed(): Set<string> {
  const [cookies] = useCookies<any>([USER_ALLOWED_COOKIE_NAME]);

  const allowedString = cookies[USER_ALLOWED_COOKIE_NAME];

  // if no cookies or any empty value then our allowed is an empty set
  if (_.isEmpty(allowedString)) return new Set<string>();

  return new Set<string>(allowedString.split(","));
}
