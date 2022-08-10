import { useCookies } from "react-cookie";
import { USER_ALLOWED_COOKIE_NAME } from "@umccr/elsa-constants";

/**
 * Find the set of functionality enabled for this logged in user in the UI.
 */
export function useUiAllowed(): Set<string> {
  const [cookies] = useCookies<any>([USER_ALLOWED_COOKIE_NAME]);

  return new Set<string>((cookies[USER_ALLOWED_COOKIE_NAME] || "").split(","));
}
